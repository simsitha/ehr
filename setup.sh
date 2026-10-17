#!/usr/bin/env bash
# ==============================================================================
# HESTRAHRM / Cambodia HRMS - Server Setup & Deployment Automation Script
# ==============================================================================
# This script prepares and verifies all dependency requirements, installs system
# packages, provisions PostgreSQL, configures Nginx reverse proxy & SSL,
# enables UFW firewall & Fail2ban, compiles native modules, applies initial data,
# builds Next.js, and configures the systemd background services.
#
# Requirements & Dependencies:
#   - OS: Ubuntu 20.04+, Debian 11+, RHEL/Rocky/Alma 8+, Alpine 3.18+, Arch
#   - Privilege: Root or sudo access (for OS packages, systemd, and port binding)
#   - Hardware: Minimum 1.5GB RAM (or 1GB RAM + 1GB Swap; script auto-allocates swap)
#   - System Packages: curl, wget, git, build-essential (gcc, g++, make), python3,
#                      python3-dev, ca-certificates, gnupg, sqlite3, libsqlite3-dev,
#                      postgresql, postgresql-contrib, postgresql-client, libpq-dev,
#                      nginx, certbot, python3-certbot-nginx, ufw/firewalld, fail2ban, jq, tar,
#                      iproute2 (ss), net-tools, procps, lsof, iputils-ping, openssl
#   - Runtime: Node.js 20.x+ LTS and npm
#   - Database: PostgreSQL 14+ (hrm_db, hrm_user) and SQLite compatibility (hr.db)
#   - Node Modules: next (v16.3+), react (v19+), better-sqlite3, pg, zklib-ng, tsx
#
# Usage:
#   sudo ./setup.sh [OPTIONS]
#
# Options:
#   -p, --port <PORT>       Set internal application port (default: 3000 with Nginx, 80 standalone)
#   -d, --domain <DOMAIN>   Configure Nginx reverse proxy with specific domain (e.g. hrm.eclypetech.biz)
#   --ssl                   Automatically acquire Let's Encrypt SSL certificate for domain using Certbot
#   --adms-ip <IP>          ZKTeco ADMS push receiver server IP (default: auto-detected server IP)
#   --adms-port <PORT>      ZKTeco ADMS push receiver port (default: 8081)
#   --db-url <URL>          Custom PostgreSQL connection string (DATABASE_URL)
#   --trusted-ip <IP>       Additional administrator IP address to whitelist in Fail2ban
#   --standalone            Direct standalone mode without Nginx reverse proxy (Next.js binds port 80/custom)
#   --no-nginx              Same as --standalone (skip Nginx configuration)
#   --no-ufw                Skip UFW/firewalld firewall rules configuration
#   --no-fail2ban           Skip Fail2ban intrusion defense configuration
#   --deps-only             Only install all dependency requirements (OS, Node, npm, PG, Nginx, UFW) and exit
#   --check-deps            Run a diagnostic pre-flight check of all dependency requirements
#   --pg-only               Only install, configure, and verify PostgreSQL database and exit
#   --apply-db              Apply database data from data/init_data.sql (creates safety backup)
#   --db-only               Only initialize/apply the database data and exit
#   --service-only          Only configure, enable, and restart systemd services
#   --skip-deps             Skip OS-level package installation (apt-get, dnf, yum, etc.)
#   --skip-pg               Skip local PostgreSQL server provisioning (e.g. for external DB)
#   --skip-build            Skip "npm run build"
#   --skip-service          Skip systemd service setup
#   -y, --yes               Non-interactive mode (auto-accept prompts)
#   -h, --help              Show this help message
# ==============================================================================

set -e

# --- Terminal Styling ---
C_RESET="\033[0m"
C_BOLD="\033[1m"
C_GREEN="\033[1;32m"
C_BLUE="\033[1;34m"
C_CYAN="\033[1;36m"
C_YELLOW="\033[1;33m"
C_RED="\033[1;31m"

log_info() {
  echo -e "${C_BLUE}[INFO]${C_RESET} $*"
}

log_success() {
  echo -e "${C_GREEN}[SUCCESS]${C_RESET} $*"
}

log_warn() {
  echo -e "${C_YELLOW}[WARN]${C_RESET} $*"
}

log_error() {
  echo -e "${C_RED}[ERROR]${C_RESET} $*"
}

log_step() {
  echo -e "\n${C_CYAN}${C_BOLD}==> Step: $*${C_RESET}"
}

# --- Resolve Project Directory ---
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${PROJECT_DIR}"

# --- Default Options ---
TARGET_PORT=""
DOMAIN_NAME=""
TARGET_ADMS_IP=""
TARGET_ADMS_PORT=""
CUSTOM_DB_URL=""
TRUSTED_IP=""
ENABLE_SSL=false
USE_NGINX=true
CONFIGURE_UFW=true
CONFIGURE_FAIL2BAN=true
FORCE_APPLY_DB=false
DB_ONLY=false
PG_ONLY=false
SERVICE_ONLY=false
DEPS_ONLY=false
CHECK_DEPS=false
SKIP_DEPS=false
SKIP_PG=false
SKIP_BUILD=false
SKIP_SERVICE=false
AUTO_YES=false
SERVICE_NAME="hr"

# --- Argument Parsing ---
while [[ $# -gt 0 ]]; do
  case $1 in
    -p|--port)
      TARGET_PORT="$2"
      shift 2
      ;;
    -d|--domain)
      DOMAIN_NAME="$2"
      shift 2
      ;;
    --ssl)
      ENABLE_SSL=true
      shift
      ;;
    --adms-ip)
      TARGET_ADMS_IP="$2"
      shift 2
      ;;
    --adms-port)
      TARGET_ADMS_PORT="$2"
      shift 2
      ;;
    --db-url)
      CUSTOM_DB_URL="$2"
      shift 2
      ;;
    --trusted-ip)
      TRUSTED_IP="$2"
      shift 2
      ;;
    --standalone|--no-nginx)
      USE_NGINX=false
      shift
      ;;
    --no-ufw)
      CONFIGURE_UFW=false
      shift
      ;;
    --no-fail2ban)
      CONFIGURE_FAIL2BAN=false
      shift
      ;;
    --deps-only)
      DEPS_ONLY=true
      shift
      ;;
    --check-deps)
      CHECK_DEPS=true
      shift
      ;;
    --pg-only)
      PG_ONLY=true
      shift
      ;;
    --apply-db)
      FORCE_APPLY_DB=true
      shift
      ;;
    --db-only)
      DB_ONLY=true
      shift
      ;;
    --service-only)
      SERVICE_ONLY=true
      shift
      ;;
    --skip-deps)
      SKIP_DEPS=true
      shift
      ;;
    --skip-pg)
      SKIP_PG=true
      shift
      ;;
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --skip-service)
      SKIP_SERVICE=true
      shift
      ;;
    -y|--yes)
      AUTO_YES=true
      shift
      ;;
    -h|--help)
      cat << 'EOF'
HESTRAHRM - Server Setup & Dependency Deployment Automation Script

USAGE:
  sudo ./setup.sh [OPTIONS]

DEPENDENCY REQUIREMENTS:
  1. Linux OS (Ubuntu 20.04+, Debian 11+, RHEL/Rocky/Alma 8+, Alpine 3.18+, Arch)
  2. RAM: 1.5GB+ (or 1GB RAM + 1GB Swap; script auto-allocates swap)
  3. Disk: At least 2GB free space
  4. Native Build Tools: gcc, g++, make, python3, python3-dev
  5. Database: PostgreSQL 14+ (server, client tools: psql, pg_dump, libpq-dev) & SQLite3
  6. Runtime: Node.js 20.x+ LTS (NodeSource) and npm 9+/10+
  7. Web & Security: Nginx reverse proxy, Certbot Let's Encrypt, UFW/firewalld, Fail2ban
  8. Process & Utilities: iproute2 (ss), net-tools, procps, lsof, jq, tar, openssl

OPTIONS:
  -p, --port <PORT>       Internal app port (default: 3000 with Nginx, 80 in standalone)
  -d, --domain <DOMAIN>   Configure Nginx reverse proxy with domain (e.g. hrm.eclypetech.biz)
  --ssl                   Acquire Let's Encrypt SSL certificate via Certbot for domain
  --adms-ip <IP>          ZKTeco ADMS push receiver server IP (default: auto-detected server IP)
  --adms-port <PORT>      ZKTeco ADMS push receiver port (default: 8081)
  --db-url <URL>          Custom PostgreSQL connection string (DATABASE_URL)
  --trusted-ip <IP>       Additional administrator IP address to whitelist in Fail2ban
  --standalone            Direct standalone mode without Nginx (Next.js binds directly)
  --no-nginx              Same as --standalone (skip Nginx configuration)
  --no-ufw                Skip UFW/firewalld firewall rules configuration
  --no-fail2ban           Skip Fail2ban intrusion defense configuration
  --deps-only             Only install and verify all dependency requirements and exit
  --check-deps            Run a diagnostic pre-flight check of all dependency requirements
  --pg-only               Only install, start, configure, and verify PostgreSQL requirements
  --apply-db              Apply database data from data/init_data.sql (creates backup)
  --db-only               Only initialize/apply the database data and exit
  --service-only          Only configure, enable, and restart systemd services
  --skip-deps             Skip OS-level package installation (apt-get, dnf, yum, etc.)
  --skip-pg               Skip local PostgreSQL server installation/setup (for external DB)
  --skip-build            Skip Next.js production build ("npm run build")
  --skip-service          Skip systemd service setup
  -y, --yes               Non-interactive mode (auto-accept prompts)
  -h, --help              Show this help message

EXAMPLES:
  # 1. Full automated production deployment with Nginx & Firewall:
  sudo ./setup.sh

  # 2. Production deployment for a custom domain with automated SSL:
  sudo ./setup.sh -d hrm.eclypetech.biz --ssl

  # 3. Specify explicit ADMS Push Receiver IP for biometric terminals:
  sudo ./setup.sh --adms-ip 192.168.10.168

  # 4. Use external PostgreSQL database:
  sudo ./setup.sh --db-url "postgresql://dbuser:secret@10.0.0.5:5432/hrm_production" --skip-pg

  # 5. Check current server dependency readiness:
  ./setup.sh --check-deps
EOF
      exit 0
      ;;
    *)
      log_error "Unknown option: $1. Run with --help for usage details."
      exit 1
      ;;
  esac
done

echo -e "${C_CYAN}${C_BOLD}"
echo "=================================================================="
echo "    HESTRAHRM - Automated Server Setup & Service Deployment       "
echo "=================================================================="
echo -e "${C_RESET}"
log_info "Project Directory: ${PROJECT_DIR}"

# --- Privilege Check ---
IS_ROOT=false
if [ "$EUID" -eq 0 ]; then
  IS_ROOT=true
fi

SUDO=""
if [ "$IS_ROOT" = false ]; then
  if command -v sudo >/dev/null 2>&1; then
    SUDO="sudo"
  fi
fi

if [ "$IS_ROOT" = false ] && [ "$CHECK_DEPS" = false ]; then
  if [ "$SERVICE_ONLY" = true ] || [ "$SKIP_DEPS" = false ] || [ "$DEPS_ONLY" = true ] || [ "$PG_ONLY" = true ]; then
    if [ -n "$SUDO" ]; then
      log_info "Running as non-root user (EUID $EUID). sudo will be used for system-level operations."
    else
      log_error "Root or sudo privileges are required to install system packages, configure Nginx, and manage services."
      log_error "Please run this script as root or with sudo: sudo ./setup.sh"
      exit 1
    fi
  fi
fi

# Auto-detect primary server IP (used for default ADMS push receiver and networking)
DETECTED_SERVER_IP="$(hostname -I 2>/dev/null | awk '{print $1}' || true)"
if [ -z "$DETECTED_SERVER_IP" ]; then
  DETECTED_SERVER_IP="$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7}' || true)"
fi
if [ -z "$DETECTED_SERVER_IP" ]; then
  DETECTED_SERVER_IP="127.0.0.1"
fi

# Determine default port
if [ -z "${TARGET_PORT}" ]; then
  if [ "$USE_NGINX" = true ]; then
    TARGET_PORT="3000"
  else
    if [ "$IS_ROOT" = true ]; then
      TARGET_PORT="80"
    else
      TARGET_PORT="3000"
    fi
  fi
fi

# Auto-detect existing domain from Nginx if present
if [ -z "${DOMAIN_NAME}" ] && [ -d /etc/nginx/sites-enabled ]; then
  local_detected_domain=$(grep -rh "server_name" /etc/nginx/sites-enabled/ 2>/dev/null | grep -v "_" | head -n 1 | awk '{print $2}' | tr -d ';' || true)
  if [ -n "$local_detected_domain" ]; then
    DOMAIN_NAME="$local_detected_domain"
    log_info "Detected existing Nginx domain: ${DOMAIN_NAME}"
  fi
fi

# ==============================================================================
# FUNCTION: Pre-Flight Hardware & System Resource Checks
# ==============================================================================
check_system_resources() {
  log_step "Checking Hardware Resources & Pre-Requisite Requirements"

  # 1. Check OS and Architecture
  local os_kernel
  os_kernel="$(uname -s 2>/dev/null || echo "Unknown")"
  local os_arch
  os_arch="$(uname -m 2>/dev/null || echo "Unknown")"
  log_info "Operating System: ${os_kernel} (${os_arch})"

  # 2. Check RAM & Swap Space (Crucial for Node.js Next.js compilation)
  local total_mem_kb
  total_mem_kb=$(grep MemTotal /proc/meminfo 2>/dev/null | awk '{print $2}' || echo "2097152")
  local total_mem_mb=$((total_mem_kb / 1024))
  local total_swap_kb
  total_swap_kb=$(grep SwapTotal /proc/meminfo 2>/dev/null | awk '{print $2}' || echo "0")
  local total_swap_mb=$((total_swap_kb / 1024))

  log_info "Physical RAM    : ${total_mem_mb} MB"
  log_info "Swap Space      : ${total_swap_mb} MB"

  # If total usable memory is under 2000MB, Next.js build might trigger Linux OOM Killer.
  if [ "$((total_mem_mb + total_swap_mb))" -lt 2000 ]; then
    log_warn "Low memory detected (${total_mem_mb}MB RAM + ${total_swap_mb}MB Swap)."
    log_warn "Next.js compilation can consume up to 1.5GB memory."
    if [ "$IS_ROOT" = true ] || [ -n "$SUDO" ]; then
      if [ ! -f /swapfile ] && [ "$total_swap_mb" -lt 1024 ]; then
        log_info "Automatically provisioning a 1.5GB swapfile (/swapfile) to ensure safe Next.js compilation..."
        if $SUDO fallocate -l 1536M /swapfile 2>/dev/null || $SUDO dd if=/dev/zero of=/swapfile bs=1M count=1536 2>/dev/null; then
          $SUDO chmod 600 /swapfile
          $SUDO mkswap /swapfile >/dev/null 2>&1 || true
          $SUDO swapon /swapfile >/dev/null 2>&1 || true
          if ! grep -q "/swapfile" /etc/fstab 2>/dev/null; then
            echo "/swapfile none swap sw 0 0" | $SUDO tee -a /etc/fstab >/dev/null 2>&1 || true
          fi
          log_success "Created and activated 1.5GB swapfile at /swapfile"
        else
          log_warn "Failed to create swapfile. Ensure adequate memory is available."
        fi
      elif [ -f /swapfile ] && [ "$total_swap_mb" -eq 0 ]; then
        $SUDO swapon /swapfile >/dev/null 2>&1 || true
        log_info "Activated existing /swapfile"
      fi
    fi
  else
    log_success "System memory is sufficient for compilation."
  fi

  # 3. Check Free Disk Space
  local free_disk_mb
  free_disk_mb=$(df -m "${PROJECT_DIR}" 2>/dev/null | awk 'NR==2 {print $4}' || echo "5000")
  log_info "Free Disk Space : ${free_disk_mb} MB"
  if [ "$free_disk_mb" -lt 1500 ]; then
    log_warn "Free disk space is below 1.5GB (${free_disk_mb}MB). Installation might fail if disk runs full."
  else
    log_success "Disk space requirement satisfied (> 1.5GB available)."
  fi
}

# ==============================================================================
# FUNCTION: Diagnostic Check of All Dependencies (--check-deps)
# ==============================================================================
check_dependencies_diagnostic() {
  echo -e "\n${C_CYAN}${C_BOLD}=================================================================="
  echo -e "    HESTRAHRM - Dependency Requirements Diagnostic Pre-Flight     "
  echo -e "==================================================================${C_RESET}\n"

  local all_pass=true

  check_item() {
    local label="$1"
    local status="$2"
    local details="$3"
    if [ "$status" = true ]; then
      printf "  ${C_GREEN}[PASS]${C_RESET} %-36s : %s\n" "${label}" "${details}"
    else
      printf "  ${C_RED}[FAIL]${C_RESET} %-36s : %s\n" "${label}" "${details}"
      all_pass=false
    fi
  }

  # Root / Sudo
  check_item "Sudo / Root Privilege" "$IS_ROOT" "$([ "$IS_ROOT" = true ] && echo "Active (UID 0)" || echo "Non-root (EUID $EUID)")"

  # Compilers & Build Tools
  local has_gcc=false has_gpp=false has_make=false has_py=false
  command -v gcc >/dev/null 2>&1 && has_gcc=true
  command -v g++ >/dev/null 2>&1 && has_gpp=true
  command -v make >/dev/null 2>&1 && has_make=true
  command -v python3 >/dev/null 2>&1 && has_py=true

  check_item "C Compiler (gcc)" "$has_gcc" "$(command -v gcc 2>/dev/null || echo "Not found")"
  check_item "C++ Compiler (g++)" "$has_gpp" "$(command -v g++ 2>/dev/null || echo "Not found")"
  check_item "GNU Make (make)" "$has_make" "$(command -v make 2>/dev/null || echo "Not found")"
  check_item "Python Runtime (python3)" "$has_py" "$(python3 --version 2>/dev/null || echo "Not found")"

  local has_openssl=false
  command -v openssl >/dev/null 2>&1 && has_openssl=true
  check_item "Cryptography CLI (openssl)" "$has_openssl" "$(openssl version 2>/dev/null || echo "Not found")"

  # SQLite Tools
  local has_sqlite=false
  command -v sqlite3 >/dev/null 2>&1 && has_sqlite=true
  check_item "SQLite3 CLI (sqlite3)" "$has_sqlite" "$(sqlite3 --version 2>/dev/null | awk '{print $1}' || echo "Not found")"

  # PostgreSQL Server, Client Tools & Libraries
  local has_psql=false has_pgdump=false has_pg_isready=false has_pg_service=false has_libpq=false
  command -v psql >/dev/null 2>&1 && has_psql=true
  command -v pg_dump >/dev/null 2>&1 && has_pgdump=true
  command -v pg_isready >/dev/null 2>&1 && has_pg_isready=true

  if command -v systemctl >/dev/null 2>&1; then
    systemctl is-active --quiet postgresql 2>/dev/null && has_pg_service=true
  elif command -v service >/dev/null 2>&1; then
    service postgresql status >/dev/null 2>&1 && has_pg_service=true
  elif command -v rc-service >/dev/null 2>&1; then
    rc-service postgresql status >/dev/null 2>&1 && has_pg_service=true
  fi

  if [ -f /usr/include/postgresql/libpq-fe.h ] || [ -f /usr/include/libpq-fe.h ] || command -v pg_config >/dev/null 2>&1 || (command -v ldconfig >/dev/null 2>&1 && ldconfig -p 2>/dev/null | grep -q "libpq\.so"); then
    has_libpq=true
  fi

  check_item "PostgreSQL Client (psql)" "$has_psql" "$(psql --version 2>/dev/null || echo "Not found")"
  check_item "PostgreSQL Dump (pg_dump)" "$has_pgdump" "$(pg_dump --version 2>/dev/null || echo "Not found")"
  check_item "PostgreSQL Ready Tool (pg_isready)" "$has_pg_isready" "$([ "$has_pg_isready" = true ] && (pg_isready --version 2>/dev/null || echo "Available") || echo "Not found")"
  check_item "PostgreSQL Dev Library (libpq)" "$has_libpq" "$([ "$has_libpq" = true ] && echo "Installed" || echo "Not found")"
  check_item "PostgreSQL Service" "$has_pg_service" "$([ "$has_pg_service" = true ] && echo "Active & Running" || echo "Inactive or not installed")"

  # Node.js and npm
  local has_node=false node_ver="" node_ok=false
  if command -v node >/dev/null 2>&1; then
    has_node=true
    node_ver="$(node -v)"
    local major
    major="$(echo "$node_ver" | cut -d'v' -f2 | cut -d'.' -f1)"
    if [ "$major" -ge 20 ]; then
      node_ok=true
    fi
  fi
  check_item "Node.js (>= v20 LTS)" "$node_ok" "$([ "$has_node" = true ] && echo "$node_ver" || echo "Not found")"

  local has_npm=false npm_ver=""
  if command -v npm >/dev/null 2>&1; then
    has_npm=true
    npm_ver="$(npm -v)"
  fi
  check_item "Node Package Manager (npm)" "$has_npm" "$([ "$has_npm" = true ] && echo "v$npm_ver" || echo "Not found")"

  # Node Modules Check
  local modules_ok=false
  if [ -d "${PROJECT_DIR}/node_modules" ] && [ -f "${PROJECT_DIR}/node_modules/next/package.json" ]; then
    modules_ok=true
  fi
  check_item "Node Modules (node_modules/)" "$modules_ok" "$([ "$modules_ok" = true ] && echo "Installed" || echo "Run npm install")"

  # Native Bindings Check (better-sqlite3)
  local native_ok=false
  if command -v node >/dev/null 2>&1 && [ "$modules_ok" = true ]; then
    if node -e "require('better-sqlite3');" 2>/dev/null; then
      native_ok=true
    fi
  fi
  check_item "SQLite Native Addon (better-sqlite3)" "$native_ok" "$([ "$native_ok" = true ] && echo "Loaded successfully" || echo "Run npm rebuild better-sqlite3")"

  # TypeScript Runner (tsx)
  local has_tsx=false
  if [ -x "${PROJECT_DIR}/node_modules/.bin/tsx" ] || command -v tsx >/dev/null 2>&1; then
    has_tsx=true
  fi
  check_item "TypeScript Runner (tsx)" "$has_tsx" "$([ "$has_tsx" = true ] && echo "Available" || echo "Run npm install")"

  # PostgreSQL Node.js Driver Check (pg)
  local pg_driver_ok=false
  if command -v node >/dev/null 2>&1 && [ "$modules_ok" = true ]; then
    if node -e "require('pg');" 2>/dev/null; then
      pg_driver_ok=true
    fi
  fi
  check_item "PostgreSQL Node.js Driver (pg)" "$pg_driver_ok" "$([ "$pg_driver_ok" = true ] && echo "Loaded successfully" || echo "Run npm install pg")"

  # PostgreSQL Database Connection Check
  local pg_conn_ok=false
  local pg_uri="${CUSTOM_DB_URL:-${DATABASE_URL:-postgresql://hrm_user:hrm_password@127.0.0.1:5432/hrm_db}}"
  if [ "$has_psql" = true ]; then
    if psql "${pg_uri}" -c "SELECT 1;" >/dev/null 2>&1; then
      pg_conn_ok=true
    fi
  fi
  check_item "PostgreSQL Database (hrm_db)" "$pg_conn_ok" "$([ "$pg_conn_ok" = true ] && echo "Connected via TCP" || echo "Cannot connect with hrm_user")"

  # Web Server & Security Components
  local has_nginx=false nginx_ok=false
  if command -v nginx >/dev/null 2>&1; then
    has_nginx=true
    if nginx -t >/dev/null 2>&1; then
      nginx_ok=true
    fi
  fi
  check_item "Nginx Reverse Proxy" "$has_nginx" "$([ "$has_nginx" = true ] && echo "Installed (Config syntax: $([ "$nginx_ok" = true ] && echo "OK" || echo "Syntax check failed"))" || echo "Not installed")"

  local has_certbot=false
  command -v certbot >/dev/null 2>&1 && has_certbot=true
  check_item "Certbot Let's Encrypt" "$has_certbot" "$([ "$has_certbot" = true ] && certbot --version 2>/dev/null || echo "Not installed")"

  local fw_ok=false fw_details="Not installed"
  if command -v ufw >/dev/null 2>&1; then
    local ufw_active=false
    ufw status 2>/dev/null | grep -qi "active" && ufw_active=true
    fw_ok=true
    fw_details="UFW installed (Status: $([ "$ufw_active" = true ] && echo "Active" || echo "Inactive"))"
  elif command -v firewall-cmd >/dev/null 2>&1; then
    local fwd_active=false
    firewall-cmd --state >/dev/null 2>&1 && fwd_active=true
    fw_ok=true
    fw_details="Firewalld installed (Status: $([ "$fwd_active" = true ] && echo "Active" || echo "Inactive"))"
  fi
  check_item "Host Firewall (UFW / Firewalld)" "$fw_ok" "${fw_details}"

  local has_f2b=false f2b_active=false
  if command -v fail2ban-client >/dev/null 2>&1; then
    has_f2b=true
    systemctl is-active --quiet fail2ban 2>/dev/null && f2b_active=true
  fi
  check_item "Fail2ban Intrusion Defense" "$has_f2b" "$([ "$has_f2b" = true ] && echo "Installed (Status: $([ "$f2b_active" = true ] && echo "Active" || echo "Inactive"))" || echo "Not installed")"

  # Systemd Background Services
  local hr_service_ok=false adms_service_ok=false
  if command -v systemctl >/dev/null 2>&1; then
    systemctl is-active --quiet hr.service 2>/dev/null && hr_service_ok=true
    systemctl is-active --quiet hr-adms.service 2>/dev/null && adms_service_ok=true
  fi
  check_item "Application Service (hr.service)" "$hr_service_ok" "$([ "$hr_service_ok" = true ] && echo "Active & Running" || echo "Inactive or not configured")"
  check_item "ADMS Receiver (hr-adms.service)" "$adms_service_ok" "$([ "$adms_service_ok" = true ] && echo "Active & Running" || echo "Inactive or not configured")"

  local cur_adms_ip="${TARGET_ADMS_IP:-${ADMS_SERVER_IP:-${DETECTED_SERVER_IP}}}"
  local cur_adms_port="${TARGET_ADMS_PORT:-${ADMS_PORT:-8081}}"
  check_item "ADMS Push Target Endpoint" "true" "Push IP: ${cur_adms_ip} | Port: ${cur_adms_port}"

  echo -e "\n=================================================================="
  if [ "$all_pass" = true ]; then
    echo -e "${C_GREEN}${C_BOLD}Result: ALL DEPENDENCY REQUIREMENTS SATISFIED!${C_RESET}"
    echo "The environment is fully equipped to build and run HESTRAHRM."
    exit 0
  else
    echo -e "${C_YELLOW}${C_BOLD}Result: SOME DEPENDENCIES ARE MISSING OR INACTIVE.${C_RESET}"
    echo "Run 'sudo ./setup.sh' to automatically install and configure all requirements."
    exit 1
  fi
}

if [ "$CHECK_DEPS" = true ]; then
  check_dependencies_diagnostic
fi

# ==============================================================================
# FUNCTION: Install PostgreSQL Server, Client Tools & Dependencies
# ==============================================================================
install_postgresql_packages() {
  log_step "Installing PostgreSQL Database Server, Client Tools & Dev Libraries"

  if [ "$SKIP_PG" = true ]; then
    log_info "Skipping PostgreSQL packages installation (--skip-pg)."
    return 0
  fi

  if command -v apt-get >/dev/null 2>&1; then
    log_info "Installing PostgreSQL packages via apt (postgresql, postgresql-contrib, postgresql-client, libpq-dev)..."
    export DEBIAN_FRONTEND=noninteractive
    $SUDO apt-get update -y -qq
    $SUDO apt-get install -y -qq \
      postgresql \
      postgresql-contrib \
      postgresql-client \
      postgresql-client-common \
      libpq-dev

    # Verify psql binary was installed; if missing from default mirrors, configure official PGDG repository
    if ! command -v psql >/dev/null 2>&1; then
      log_info "Configuring official PostgreSQL Global Development Group (PGDG) apt repository..."
      $SUDO apt-get install -y -qq curl ca-certificates gnupg lsb-release
      $SUDO install -d -m 0755 /etc/apt/keyrings
      curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | $SUDO gpg --dearmor -o /etc/apt/keyrings/postgresql.gpg --yes 2>/dev/null || true
      local codename
      codename="$(lsb_release -cs 2>/dev/null || echo "bookworm")"
      echo "deb [signed-by=/etc/apt/keyrings/postgresql.gpg] http://apt.postgresql.org/pub/repos/apt ${codename}-pgdg main" | $SUDO tee /etc/apt/sources.list.d/pgdg.list >/dev/null
      $SUDO apt-get update -y -qq
      $SUDO apt-get install -y -qq postgresql postgresql-contrib postgresql-client libpq-dev || true
    fi
    log_success "PostgreSQL server, client tools, and dev libraries installed via apt."

  elif command -v dnf >/dev/null 2>&1 || command -v yum >/dev/null 2>&1; then
    local pkg_mgr="dnf"
    command -v dnf >/dev/null 2>&1 || pkg_mgr="yum"
    log_info "Installing PostgreSQL packages via ${pkg_mgr} (postgresql, postgresql-server, postgresql-contrib, libpq-devel)..."
    $SUDO $pkg_mgr install -y epel-release || true
    $SUDO $pkg_mgr install -y \
      postgresql \
      postgresql-server \
      postgresql-contrib \
      postgresql-devel \
      libpq-devel || true
    log_success "PostgreSQL packages installed successfully via ${pkg_mgr}."

  elif command -v apk >/dev/null 2>&1; then
    log_info "Installing PostgreSQL packages via apk (postgresql, postgresql-client, postgresql-contrib, postgresql-dev)..."
    $SUDO apk add --no-cache \
      postgresql \
      postgresql-client \
      postgresql-contrib \
      postgresql-dev || true
    log_success "PostgreSQL packages installed successfully via apk."

  elif command -v pacman >/dev/null 2>&1; then
    log_info "Installing PostgreSQL packages via pacman (postgresql, postgresql-libs)..."
    $SUDO pacman -Sy --noconfirm --needed \
      postgresql \
      postgresql-libs || true
    log_success "PostgreSQL packages installed successfully via pacman."

  else
    log_warn "Unknown package manager. Please ensure PostgreSQL 14+ is installed manually."
  fi
}

# ==============================================================================
# FUNCTION: Install System OS Packages & Build Tools
# ==============================================================================
install_system_dependencies() {
  log_step "Installing System OS Dependencies, Compilers & Security Packages"

  if command -v apt-get >/dev/null 2>&1; then
    log_info "Detected Debian/Ubuntu Linux distribution (apt-get)."
    export DEBIAN_FRONTEND=noninteractive
    log_info "Updating apt package index..."
    $SUDO apt-get update -y -qq

    log_info "Installing build tools, runtimes, security, and network utilities:"
    log_info " - Build tools : build-essential, gcc, g++, make, python3, python3-dev"
    log_info " - SQLite      : sqlite3, libsqlite3-dev"
    log_info " - Web & Proxy : nginx, certbot, python3-certbot-nginx"
    log_info " - Security    : ufw, fail2ban"
    log_info " - Utilities   : curl, wget, git, ca-certificates, gnupg, iproute2, net-tools, procps, lsof, jq, tar, iputils-ping, openssl"

    $SUDO apt-get install -y -qq \
      curl \
      wget \
      git \
      build-essential \
      gcc \
      g++ \
      make \
      python3 \
      python3-dev \
      sqlite3 \
      libsqlite3-dev \
      ca-certificates \
      gnupg \
      iproute2 \
      net-tools \
      procps \
      lsof \
      ufw \
      fail2ban \
      nginx \
      certbot \
      python3-certbot-nginx \
      jq \
      tar \
      iputils-ping \
      openssl

    log_success "System OS packages installed successfully via apt."

  elif command -v dnf >/dev/null 2>&1 || command -v yum >/dev/null 2>&1; then
    local pkg_mgr="dnf"
    command -v dnf >/dev/null 2>&1 || pkg_mgr="yum"
    log_info "Detected RHEL/Fedora/Rocky/Alma/CentOS Linux distribution (${pkg_mgr})."
    $SUDO $pkg_mgr install -y epel-release || true
    $SUDO $pkg_mgr groupinstall -y "Development Tools" 2>/dev/null || $SUDO $pkg_mgr install -y gcc gcc-c++ make || true
    $SUDO $pkg_mgr install -y \
      curl \
      wget \
      git \
      python3 \
      python3-devel \
      make \
      gcc \
      gcc-c++ \
      sqlite \
      sqlite-devel \
      ca-certificates \
      gnupg2 \
      iproute \
      procps-ng \
      net-tools \
      lsof \
      nginx \
      certbot \
      python3-certbot-nginx \
      fail2ban \
      jq \
      tar \
      openssl || true

    # SELinux policy for Nginx reverse proxying to Node.js backend
    if command -v getenforce >/dev/null 2>&1 && [ "$(getenforce 2>/dev/null)" != "Disabled" ]; then
      log_info "Configuring SELinux policy for Nginx network proxying..."
      $SUDO setsebool -P httpd_can_network_connect 1 2>/dev/null || true
    fi
    log_success "System OS packages installed successfully via ${pkg_mgr}."

  elif command -v apk >/dev/null 2>&1; then
    log_info "Detected Alpine Linux (apk)."
    $SUDO apk add --no-cache \
      curl \
      wget \
      git \
      build-base \
      python3 \
      python3-dev \
      make \
      g++ \
      gcc \
      sqlite \
      sqlite-dev \
      ca-certificates \
      iproute2 \
      procps \
      net-tools \
      nginx \
      fail2ban \
      jq \
      tar \
      openssl
    log_success "System OS packages installed successfully via apk."

  elif command -v pacman >/dev/null 2>&1; then
    log_info "Detected Arch Linux (pacman)."
    $SUDO pacman -Sy --noconfirm --needed \
      base-devel \
      git \
      curl \
      wget \
      python \
      make \
      gcc \
      sqlite \
      iproute2 \
      procps-ng \
      net-tools \
      lsof \
      ca-certificates \
      nginx \
      certbot \
      fail2ban \
      jq \
      tar \
      openssl
    log_success "System OS packages installed successfully via pacman."

  else
    log_warn "Unknown or unsupported package manager."
    log_warn "Please verify that curl, git, build-essential, python3, postgresql, nginx, and sqlite3 are installed."
  fi

  # Install PostgreSQL packages and libraries
  install_postgresql_packages
}

# ==============================================================================
# FUNCTION: Install & Verify Node.js v20+ LTS Runtime
# ==============================================================================
install_nodejs_runtime() {
  log_step "Verifying and Installing Node.js LTS Runtime (v20+ Required)"

  local need_node_install=false

  if ! command -v node >/dev/null 2>&1; then
    log_warn "Node.js is not installed."
    need_node_install=true
  else
    local node_major
    node_major="$(node -v | cut -d'v' -f2 | cut -d'.' -f1)"
    if [ "$node_major" -lt 20 ]; then
      log_warn "Installed Node.js version $(node -v) is older than v20 (Next.js 16 requires Node.js v20+ LTS)."
      need_node_install=true
    else
      log_success "Node.js $(node -v) is already installed."
    fi
  fi

  if [ "$need_node_install" = true ]; then
    if command -v apt-get >/dev/null 2>&1; then
      log_info "Setting up official NodeSource repository for Node.js 20.x LTS..."
      curl -fsSL https://deb.nodesource.com/setup_20.x | $SUDO bash -
      $SUDO apt-get install -y -qq nodejs
      log_success "Installed Node.js $(node -v) and npm $(npm -v)."
    elif command -v dnf >/dev/null 2>&1 || command -v yum >/dev/null 2>&1; then
      local pkg_mgr="dnf"
      command -v dnf >/dev/null 2>&1 || pkg_mgr="yum"
      log_info "Setting up NodeSource RPM repository for Node.js 20.x LTS via ${pkg_mgr}..."
      curl -fsSL https://rpm.nodesource.com/setup_20.x | $SUDO bash -
      $SUDO $pkg_mgr install -y nodejs
      log_success "Installed Node.js $(node -v) and npm $(npm -v)."
    elif command -v apk >/dev/null 2>&1; then
      $SUDO apk add --no-cache nodejs npm
      log_success "Installed Node.js $(node -v) and npm $(npm -v)."
    elif command -v pacman >/dev/null 2>&1; then
      $SUDO pacman -Sy --noconfirm nodejs npm
      log_success "Installed Node.js $(node -v) and npm $(npm -v)."
    else
      log_error "Automatic Node.js 20+ installation not supported on this platform. Please install Node.js 20+ manually."
      exit 1
    fi
  fi

  # Verify npm is operational
  if ! command -v npm >/dev/null 2>&1; then
    log_error "npm command not found. Installing npm..."
    if command -v apt-get >/dev/null 2>&1; then
      $SUDO apt-get install -y -qq npm
    elif command -v dnf >/dev/null 2>&1 || command -v yum >/dev/null 2>&1; then
      local pkg_mgr="dnf"; command -v dnf >/dev/null 2>&1 || pkg_mgr="yum"
      $SUDO $pkg_mgr install -y npm
    fi
  fi
  log_success "Node runtime verified: Node.js $(node -v) | npm v$(npm -v)"
}

# ==============================================================================
# FUNCTION: Provision PostgreSQL Service & Application User/Database
# ==============================================================================
setup_postgresql_service() {
  log_step "Configuring PostgreSQL Service, Database, and Roles"

  if [ "$SKIP_PG" = true ]; then
    log_info "Skipping local PostgreSQL provisioning (--skip-pg)."
    return 0
  fi

  # 1. Initialize DB cluster if required on RHEL/Alpine/Arch
  if command -v postgresql-setup >/dev/null 2>&1; then
    if [ ! -f /var/lib/pgsql/data/PG_VERSION ]; then
      log_info "Initializing PostgreSQL database cluster (postgresql-setup --initdb)..."
      postgresql-setup --initdb 2>/dev/null || postgresql-setup initdb 2>/dev/null || true
    fi
  elif [ -d /var/lib/postgresql ] && [ ! -d /var/lib/postgresql/data/base ]; then
    if command -v initdb >/dev/null 2>&1; then
      log_info "Initializing PostgreSQL cluster in /var/lib/postgresql/data..."
      su - postgres -c "initdb -D /var/lib/postgresql/data" >/dev/null 2>&1 || true
    fi
  elif [ -d /var/lib/postgres ] && [ ! -d /var/lib/postgres/data/base ]; then
    if command -v initdb >/dev/null 2>&1; then
      log_info "Initializing PostgreSQL cluster in /var/lib/postgres/data..."
      su - postgres -c "initdb --locale=C.UTF-8 -E UTF8 -D /var/lib/postgres/data" >/dev/null 2>&1 || true
    fi
  fi

  # 2. Start and enable PostgreSQL service
  if command -v systemctl >/dev/null 2>&1; then
    log_info "Enabling and starting PostgreSQL service via systemctl..."
    $SUDO systemctl enable postgresql >/dev/null 2>&1 || true
    $SUDO systemctl start postgresql >/dev/null 2>&1 || true
  elif command -v service >/dev/null 2>&1; then
    $SUDO service postgresql start >/dev/null 2>&1 || true
  elif command -v rc-service >/dev/null 2>&1; then
    $SUDO rc-service postgresql start >/dev/null 2>&1 || true
  fi

  # 3. Wait for PostgreSQL daemon to accept connections
  log_info "Waiting for PostgreSQL service to become ready..."
  local pg_ready=false
  for i in {1..15}; do
    if command -v pg_isready >/dev/null 2>&1; then
      if pg_isready -q 2>/dev/null || pg_isready -h 127.0.0.1 -p 5432 -q 2>/dev/null; then
        pg_ready=true
        break
      fi
    elif command -v psql >/dev/null 2>&1; then
      if su - postgres -c "psql -c 'SELECT 1;'" >/dev/null 2>&1 || sudo -u postgres psql -c 'SELECT 1;' >/dev/null 2>&1; then
        pg_ready=true
        break
      fi
    fi
    sleep 1
  done

  if [ "$pg_ready" = true ]; then
    log_success "PostgreSQL daemon is active and ready."
  else
    log_warn "PostgreSQL daemon did not respond immediately. Continuing with configuration..."
  fi

  # 4. Resolve target database credentials from argument or .env if present, otherwise defaults
  local target_pg_user="hrm_user"
  local target_pg_pass="hrm_password"
  local target_pg_db="hrm_db"
  local target_pg_host="127.0.0.1"
  local target_pg_port="5432"

  local resolved_pg_uri="${CUSTOM_DB_URL:-}"
  if [ -z "$resolved_pg_uri" ] && [ -f "${PROJECT_DIR}/.env" ]; then
    resolved_pg_uri=$(grep "^DATABASE_URL=" "${PROJECT_DIR}/.env" 2>/dev/null | cut -d'=' -f2- | tr -d ' "' || true)
  fi

  if [ -n "$resolved_pg_uri" ]; then
    if [[ "$resolved_pg_uri" =~ postgresql://([^:]+):([^@]+)@([^:/]+):?([0-9]*)/(.+) ]]; then
      target_pg_user="${BASH_REMATCH[1]}"
      target_pg_pass="${BASH_REMATCH[2]}"
      target_pg_host="${BASH_REMATCH[3]}"
      target_pg_port="${BASH_REMATCH[4]:-5432}"
      target_pg_db="${BASH_REMATCH[5]}"
    fi
  fi

  # 5. Provision hrm_user and hrm_db if running with sudo/root and host is local
  if [ "$IS_ROOT" = true ] || [ -n "$SUDO" ]; then
    if [ "$target_pg_host" = "127.0.0.1" ] || [ "$target_pg_host" = "localhost" ]; then
      log_info "Provisioning PostgreSQL user '${target_pg_user}' and database '${target_pg_db}'..."

      local su_cmd="su - postgres -c"
      if command -v sudo >/dev/null 2>&1; then
        su_cmd="sudo -u postgres"
      fi

      # Create role if not exists, or update password & permissions
      local role_exists=0
      role_exists=$(${su_cmd} "psql -tAc \"SELECT 1 FROM pg_roles WHERE rolname='${target_pg_user}'\"" 2>/dev/null || echo 0)
      if [ "$role_exists" != "1" ]; then
        log_info "Creating PostgreSQL role: ${target_pg_user}"
        ${su_cmd} "psql -c \"CREATE USER ${target_pg_user} WITH PASSWORD '${target_pg_pass}' SUPERUSER CREATEDB;\"" >/dev/null 2>&1 || true
      else
        log_info "Updating PostgreSQL role '${target_pg_user}' credentials and permissions..."
        ${su_cmd} "psql -c \"ALTER USER ${target_pg_user} WITH PASSWORD '${target_pg_pass}' SUPERUSER CREATEDB;\"" >/dev/null 2>&1 || true
      fi

      # Create database if not exists
      local db_exists=0
      db_exists=$(${su_cmd} "psql -tAc \"SELECT 1 FROM pg_database WHERE datname='${target_pg_db}'\"" 2>/dev/null || echo 0)
      if [ "$db_exists" != "1" ]; then
        log_info "Creating PostgreSQL database: ${target_pg_db}"
        ${su_cmd} "psql -c \"CREATE DATABASE ${target_pg_db} OWNER ${target_pg_user};\"" >/dev/null 2>&1 || true
      else
        log_info "PostgreSQL database '${target_pg_db}' already exists."
      fi
      ${su_cmd} "psql -c \"GRANT ALL PRIVILEGES ON DATABASE ${target_pg_db} TO ${target_pg_user};\"" >/dev/null 2>&1 || true
      # PostgreSQL 15+ schema public ownership & permissions
      ${su_cmd} "psql -d ${target_pg_db} -c \"GRANT ALL ON SCHEMA public TO ${target_pg_user}; ALTER SCHEMA public OWNER TO ${target_pg_user};\"" >/dev/null 2>&1 || true

      # Check pg_hba.conf to ensure local TCP password authentication
      local pg_hba_path
      pg_hba_path=$(${su_cmd} "psql -tAc \"SHOW hba_file;\"" 2>/dev/null || true)
      if [ -n "$pg_hba_path" ] && [ -f "$pg_hba_path" ]; then
        if ! grep -qE "^\s*host\s+${target_pg_db}\s+${target_pg_user}\s+127\.0\.0\.1\/32" "$pg_hba_path" 2>/dev/null; then
          log_info "Configuring pg_hba.conf to allow local TCP connection for ${target_pg_user}..."
          echo "host    ${target_pg_db}     ${target_pg_user}     127.0.0.1/32            scram-sha-256" | $SUDO tee -a "$pg_hba_path" >/dev/null
          echo "host    ${target_pg_db}     ${target_pg_user}     ::1/128                 scram-sha-256" | $SUDO tee -a "$pg_hba_path" >/dev/null
          ${su_cmd} "psql -c \"SELECT pg_reload_conf();\"" >/dev/null 2>&1 || true
        fi
      fi
    fi
  fi

  # 6. Test TCP connection with configured credentials
  local test_pg_uri="postgresql://${target_pg_user}:${target_pg_pass}@${target_pg_host}:${target_pg_port}/${target_pg_db}"
  if command -v psql >/dev/null 2>&1; then
    if PGPASSWORD="${target_pg_pass}" psql -h "${target_pg_host}" -p "${target_pg_port}" -U "${target_pg_user}" -d "${target_pg_db}" -c "SELECT 1;" >/dev/null 2>&1; then
      log_success "PostgreSQL connection to ${target_pg_db} via ${test_pg_uri} verified successfully."
    else
      # If scram-sha-256 failed on older postgres, try md5
      local local_hba
      local_hba=$(${su_cmd} "psql -tAc \"SHOW hba_file;\"" 2>/dev/null || true)
      if [ -n "$local_hba" ] && [ -f "$local_hba" ]; then
        echo "host    ${target_pg_db}     ${target_pg_user}     127.0.0.1/32            md5" | $SUDO tee -a "$local_hba" >/dev/null 2>&1 || true
        ${su_cmd} "psql -c \"SELECT pg_reload_conf();\"" >/dev/null 2>&1 || true
      fi
      if PGPASSWORD="${target_pg_pass}" psql -h "${target_pg_host}" -p "${target_pg_port}" -U "${target_pg_user}" -d "${target_pg_db}" -c "SELECT 1;" >/dev/null 2>&1; then
        log_success "PostgreSQL connection to ${target_pg_db} verified successfully with md5 auth."
      else
        log_warn "Could not connect to PostgreSQL using ${test_pg_uri}."
        log_warn "If using a custom external database, verify DATABASE_URL in .env."
      fi
    fi
  fi
}

# If --pg-only was passed, install/provision PostgreSQL requirements and exit
if [ "$PG_ONLY" = true ]; then
  install_postgresql_packages
  setup_postgresql_service
  echo -e "\n${C_GREEN}${C_BOLD}=================================================================="
  echo "    POSTGRESQL REQUIREMENTS INSTALLED & CONFIGURED SUCCESSFULLY!"
  echo -e "==================================================================${C_RESET}"
  exit 0
fi

# ==============================================================================
# FUNCTION: Configure Nginx Reverse Proxy & Optional SSL
# ==============================================================================
setup_nginx_reverse_proxy() {
  log_step "Configuring Nginx Reverse Proxy & HTTP/HTTPS Ingress"

  if [ "$USE_NGINX" = false ]; then
    log_info "Skipping Nginx reverse proxy configuration (--standalone or --no-nginx)."
    return 0
  fi

  if ! command -v nginx >/dev/null 2>&1; then
    log_warn "Nginx is not installed. Skipping reverse proxy configuration."
    return 0
  fi

  # Stop conflicting web servers (apache2 / httpd) if running
  if command -v systemctl >/dev/null 2>&1; then
    if systemctl is-active --quiet apache2 2>/dev/null; then
      log_warn "Conflicting apache2 service detected. Stopping and disabling it to free port 80 for Nginx..."
      $SUDO systemctl stop apache2 2>/dev/null || true
      $SUDO systemctl disable apache2 2>/dev/null || true
    fi
    if systemctl is-active --quiet httpd 2>/dev/null; then
      log_warn "Conflicting httpd service detected. Stopping and disabling it to free port 80 for Nginx..."
      $SUDO systemctl stop httpd 2>/dev/null || true
      $SUDO systemctl disable httpd 2>/dev/null || true
    fi
  fi

  local domain="${DOMAIN_NAME:-_}"
  local app_port="${TARGET_PORT:-3000}"
  local nginx_conf_dir="/etc/nginx/conf.d"
  local nginx_conf="${nginx_conf_dir}/hestra-hrm.conf"

  # Check if an existing SSL site is already configured and working for the domain
  local has_existing_ssl=false
  if [ -d /etc/nginx/sites-enabled ]; then
    if grep -rq "ssl_certificate" /etc/nginx/sites-enabled/ 2>/dev/null; then
      has_existing_ssl=true
      log_info "Existing SSL certificate configuration detected in Nginx sites-enabled."
    fi
  fi
  if [ -d /etc/nginx/conf.d ]; then
    if grep -rq "ssl_certificate" /etc/nginx/conf.d/ 2>/dev/null; then
      has_existing_ssl=true
      log_info "Existing SSL certificate configuration detected in Nginx conf.d."
    fi
  fi

  if [ "$has_existing_ssl" = true ]; then
    log_info "Preserving existing SSL configuration in Nginx."
    $SUDO systemctl reload nginx || $SUDO systemctl restart nginx || true
    log_success "Nginx reverse proxy is active with existing SSL."
    return 0
  fi

  log_info "Generating Nginx reverse proxy configuration: ${nginx_conf}"
  $SUDO mkdir -p /etc/nginx/conf.d /etc/nginx/sites-available /etc/nginx/sites-enabled

  $SUDO tee "${nginx_conf}" > /dev/null << EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${domain};

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:${app_port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
    }
}
EOF

  # Also write to sites-available / sites-enabled if standard Debian/Ubuntu directory structure is present
  if [ -d /etc/nginx/sites-available ]; then
    $SUDO cp "${nginx_conf}" /etc/nginx/sites-available/hestra-hrm 2>/dev/null || true
    if [ -d /etc/nginx/sites-enabled ]; then
      $SUDO ln -sf /etc/nginx/sites-available/hestra-hrm /etc/nginx/sites-enabled/hestra-hrm 2>/dev/null || true
    fi
  fi

  # Remove default Ubuntu/Debian/RHEL landing placeholder sites if present
  if [ -f /etc/nginx/sites-enabled/default ]; then
    $SUDO rm -f /etc/nginx/sites-enabled/default
    log_info "Removed default Nginx placeholder site from sites-enabled."
  fi
  if [ -f /etc/nginx/conf.d/default.conf ]; then
    $SUDO rm -f /etc/nginx/conf.d/default.conf
    log_info "Removed default Nginx placeholder site from conf.d."
  fi

  # Validate and reload Nginx
  if $SUDO nginx -t >/dev/null 2>&1; then
    $SUDO systemctl enable nginx >/dev/null 2>&1 || true
    $SUDO systemctl restart nginx || $SUDO systemctl reload nginx || true
    log_success "Nginx reverse proxy successfully configured (port 80 -> 127.0.0.1:${app_port})."
  else
    log_warn "Nginx syntax test failed. Details:"
    $SUDO nginx -t || true
  fi

  # Optional SSL acquisition via Certbot
  if [ "$ENABLE_SSL" = true ] && [ "$domain" != "_" ] && command -v certbot >/dev/null 2>&1; then
    log_info "Acquiring Let's Encrypt SSL certificate for domain: ${domain}..."
    $SUDO certbot --nginx -d "${domain}" --non-interactive --agree-tos --register-unsafely-without-email --redirect || true
    $SUDO systemctl reload nginx || true
    log_success "Let's Encrypt SSL configured for https://${domain}."
  fi
}

# ==============================================================================
# FUNCTION: Configure UFW / Firewalld Protection
# ==============================================================================
setup_ufw_firewall() {
  log_step "Configuring Host Firewall Protection (UFW / Firewalld)"

  if [ "$CONFIGURE_UFW" = false ]; then
    log_info "Skipping firewall setup (--no-ufw)."
    return 0
  fi

  local adms_port="${TARGET_ADMS_PORT:-${ADMS_PORT:-8081}}"

  if command -v ufw >/dev/null 2>&1; then
    log_info "Detected UFW firewall. Setting default policies: incoming deny, outgoing allow..."
    $SUDO ufw default deny incoming >/dev/null 2>&1 || true
    $SUDO ufw default allow outgoing >/dev/null 2>&1 || true

    log_info "Allowing standard core services in UFW:"
    log_info " - Port 22/tcp   (SSH)"
    log_info " - Port 80/tcp   (HTTP / Let's Encrypt ACME)"
    log_info " - Port 443/tcp  (HTTPS)"
    log_info " - Port ${adms_port}/tcp (ZKTeco ADMS Biometric Push)"

    $SUDO ufw allow 22/tcp comment 'SSH' >/dev/null 2>&1 || true
    $SUDO ufw allow 80/tcp comment 'HTTP' >/dev/null 2>&1 || true
    $SUDO ufw allow 443/tcp comment 'HTTPS' >/dev/null 2>&1 || true
    $SUDO ufw allow "${adms_port}/tcp" comment 'ZKTeco ADMS' >/dev/null 2>&1 || true

    # If Wazuh is present or requested, allow Wazuh ports
    if command -v /var/ossec/bin/wazuh-control >/dev/null 2>&1 || [ -d /etc/wazuh-dashboard ]; then
      log_info "Wazuh SIEM detected. Opening Wazuh ports:"
      $SUDO ufw allow 8443/tcp comment 'Wazuh Dashboard' >/dev/null 2>&1 || true
      $SUDO ufw allow 1514/tcp comment 'Wazuh Agent traffic' >/dev/null 2>&1 || true
      $SUDO ufw allow 1515/tcp comment 'Wazuh Agent enrollment' >/dev/null 2>&1 || true
    fi

    # Enable UFW if inactive
    if ! ufw status 2>/dev/null | grep -qi "Status: active"; then
      log_info "Enabling UFW firewall..."
      $SUDO ufw --force enable >/dev/null 2>&1 || true
    fi
    log_success "UFW firewall is active and configured."

  elif command -v firewall-cmd >/dev/null 2>&1 && systemctl is-active --quiet firewalld 2>/dev/null; then
    log_info "Detected active firewalld. Configuring firewalld rules for core ports (22, 80, 443, ${adms_port})..."
    $SUDO firewall-cmd --permanent --add-service=ssh >/dev/null 2>&1 || true
    $SUDO firewall-cmd --permanent --add-service=http >/dev/null 2>&1 || true
    $SUDO firewall-cmd --permanent --add-service=https >/dev/null 2>&1 || true
    $SUDO firewall-cmd --permanent --add-port="${adms_port}/tcp" >/dev/null 2>&1 || true
    $SUDO firewall-cmd --reload >/dev/null 2>&1 || true
    log_success "Firewalld rules configured successfully."

  else
    log_info "Neither UFW nor active firewalld detected. Skipping firewall rule configuration."
  fi
}

# ==============================================================================
# FUNCTION: Configure Fail2ban Intrusion Defense
# ==============================================================================
setup_fail2ban() {
  log_step "Configuring Fail2ban Intrusion Defense"

  if [ "$CONFIGURE_FAIL2BAN" = false ]; then
    log_info "Skipping Fail2ban setup (--no-fail2ban)."
    return 0
  fi

  if ! command -v fail2ban-client >/dev/null 2>&1; then
    log_warn "Fail2ban is not installed. Skipping Fail2ban configuration."
    return 0
  fi

  local server_ip="${DETECTED_SERVER_IP:-127.0.0.1}"
  local extra_whitelist="${TRUSTED_IP:-}"

  # Determine banaction based on available firewall
  local banaction="ufw"
  if ! command -v ufw >/dev/null 2>&1; then
    banaction="iptables-multiport"
    if command -v firewall-cmd >/dev/null 2>&1 && systemctl is-active --quiet firewalld 2>/dev/null; then
      banaction="firewallcmd-rich-rules"
    fi
  fi

  # Create or update /etc/fail2ban/jail.local
  if [ ! -f /etc/fail2ban/jail.local ]; then
    log_info "Creating /etc/fail2ban/jail.local with trusted whitelist..."
    $SUDO tee /etc/fail2ban/jail.local > /dev/null << EOF
[DEFAULT]
# Whitelist local loopback, server IP, management IP, and Gemini/Google domains
ignoreip = 127.0.0.1/8 ::1 ${server_ip} ${extra_whitelist} generativelanguage.googleapis.com oauth2.googleapis.com googleapis.com google.com

# Default ban time: 1 hour
bantime = 1h

# Window of observation: 10 minutes
findtime = 10m

# Retry threshold: 5 attempts
maxretry = 5

# Firewall action
banaction = ${banaction}
banaction_allports = ${banaction}

[sshd]
enabled = true
port = 22
backend = systemd
journalmatch = _SYSTEMD_UNIT=ssh.service + _COMM=sshd
maxretry = 5
findtime = 10m
bantime = 24h

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 5
findtime = 10m
bantime = 1h

[nginx-botsearch]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 3
findtime = 10m
bantime = 24h
EOF
  else
    log_info "Existing /etc/fail2ban/jail.local detected. Keeping configuration intact."
  fi

  $SUDO systemctl enable fail2ban >/dev/null 2>&1 || true
  $SUDO systemctl restart fail2ban >/dev/null 2>&1 || true
  log_success "Fail2ban intrusion defense active with ${banaction} integration."
}

# ==============================================================================
# FUNCTION: Install Node.js Packages & Rebuild Native Addons
# ==============================================================================
install_node_packages() {
  log_step "Installing Node.js Dependencies & Compiling Native SQLite Addons"

  log_info "Running npm install to install all dependencies from package.json..."
  if ! npm install --include=dev; then
    log_warn "Initial npm install encountered warnings or peer conflicts. Retrying with --legacy-peer-deps..."
    npm install --include=dev --legacy-peer-deps
  fi
  log_success "npm dependencies installed successfully."

  log_info "Compiling / rebuilding native SQLite binary (better-sqlite3)..."
  npm rebuild better-sqlite3

  # Comprehensive dependency verification test
  log_info "Verifying core application dependencies..."
  node -e "
    const requiredModules = [
      'next',
      'react',
      'react-dom',
      'better-sqlite3',
      'pg',
      'zklib-ng',
      'canvas-confetti',
      'lucide-react'
    ];
    const missing = [];
    for (const mod of requiredModules) {
      try {
        require(mod);
      } catch (err) {
        missing.push(mod + ' (' + err.message + ')');
      }
    }
    if (missing.length > 0) {
      console.error('Dependency verification failure:');
      missing.forEach(m => console.error(' - ' + m));
      process.exit(1);
    }
  " && log_success "All core application modules (Next.js, React, better-sqlite3, pg, zklib-ng, canvas-confetti, Lucide) verified!"
}

# ==============================================================================
# FUNCTION: Apply Database Schema & Seed Data
# ==============================================================================
apply_database_data() {
  log_step "Database Configuration & Data Application"

  mkdir -p "${PROJECT_DIR}/data"
  local sql_file="${PROJECT_DIR}/data/init_data.sql"
  local db_file="${PROJECT_DIR}/data/hr.db"
  local pg_uri="${DATABASE_URL:-postgresql://hrm_user:hrm_password@127.0.0.1:5432/hrm_db}"

  if [ ! -f "${sql_file}" ]; then
    log_error "Database SQL dump not found at ${sql_file}!"
    exit 1
  fi

  local need_apply=false

  # Check if PostgreSQL has existing tables
  local has_tables=0
  if command -v psql >/dev/null 2>&1; then
    has_tables=$(psql "${pg_uri}" -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" 2>/dev/null || echo 0)
  fi

  if [ "$FORCE_APPLY_DB" = true ]; then
    log_info "--apply-db flag provided. Preparing to apply initial database data..."
    need_apply=true
  elif [ "$has_tables" -eq 0 ]; then
    log_info "PostgreSQL database contains 0 tables. Initializing fresh database from ${sql_file}..."
    need_apply=true
  else
    log_info "PostgreSQL database already contains ${has_tables} active tables."
    if [ "$AUTO_YES" = false ]; then
      echo -en "${C_YELLOW}[PROMPT] Do you want to overwrite and re-apply initial database data to PostgreSQL? (y/N): ${C_RESET}"
      read -r user_choice
      if [[ "$user_choice" =~ ^[Yy]$ ]]; then
        need_apply=true
      else
        log_info "Keeping existing database data intact."
      fi
    else
      log_info "Non-interactive mode: keeping existing database data intact."
    fi
  fi

  if [ "$need_apply" = true ]; then
    if [ -f "${PROJECT_DIR}/scripts/apply-db.js" ] && command -v node >/dev/null 2>&1; then
      log_info "Applying database dump via scripts/apply-db.js..."
      node "${PROJECT_DIR}/scripts/apply-db.js" --force --sql "${sql_file}" --url "${pg_uri}"
      log_success "Database schema and initial seed data applied successfully to PostgreSQL."
    elif command -v psql >/dev/null 2>&1; then
      log_info "Applying SQL dump directly using psql..."
      psql "${pg_uri}" -f "${sql_file}"
      log_success "Applied ${sql_file} to PostgreSQL using psql CLI."
    else
      log_error "Neither Node.js pg adapter nor psql CLI is available to apply the database dump."
      exit 1
    fi
  fi

  # Maintain file permissions on data directory and SQLite compatibility file
  chmod 755 "${PROJECT_DIR}/data" 2>/dev/null || true
  if [ -f "${db_file}" ]; then
    chmod 664 "${db_file}" 2>/dev/null || true
  fi
  log_success "Database initialization step complete."
}

# If --db-only was passed, apply db and exit
if [ "$DB_ONLY" = true ]; then
  apply_database_data
  exit 0
fi

# ==============================================================================
# FUNCTION: Configure Systemd Services (hr.service and hr-adms.service)
# ==============================================================================
configure_service() {
  log_step "Configuring and Starting systemd Services (${SERVICE_NAME}.service & ${SERVICE_NAME}-adms.service)"

  if ! command -v systemctl >/dev/null 2>&1; then
    log_warn "systemctl is not available on this system. Skipping systemd service configuration."
    log_info "You can start the app manually with: npm run start"
    return 0
  fi

  local npm_bin
  npm_bin="$(command -v npm || echo "/usr/bin/npm")"
  local node_bin
  node_bin="$(command -v node || echo "/usr/bin/node")"
  local node_dir
  node_dir="$(dirname "${node_bin}")"

  local port="${TARGET_PORT:-3000}"
  local host="127.0.0.1"

  # If in standalone mode without Nginx, bind to 0.0.0.0
  if [ "$USE_NGINX" = false ]; then
    host="0.0.0.0"
  fi

  local service_user="root"
  if [ "$IS_ROOT" = false ]; then
    service_user="$(whoami)"
  elif [ -n "$SUDO_USER" ] && [[ ! "$PROJECT_DIR" =~ ^/root ]]; then
    service_user="${SUDO_USER}"
  fi

  local service_file="/etc/systemd/system/${SERVICE_NAME}.service"

  log_info "Creating service unit: ${service_file}"
  log_info " - Working Directory: ${PROJECT_DIR}"
  log_info " - Execution Binary : ${npm_bin} run start"
  log_info " - Service User     : ${service_user}"
  log_info " - Port             : ${port}"
  log_info " - Host             : ${host}"

  $SUDO tee "${service_file}" > /dev/null << EOF
[Unit]
Description=Cambodia HR Management System (HESTRAHRM)
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=${service_user}
WorkingDirectory=${PROJECT_DIR}
EnvironmentFile=-${PROJECT_DIR}/.env
Environment=NODE_ENV=production
Environment=PORT=${port}
Environment=HOST=${host}
Environment=PATH=${node_dir}:${PROJECT_DIR}/node_modules/.bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
ExecStart=${npm_bin} run start
Restart=always
RestartSec=5
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
EOF

  $SUDO chmod 644 "${service_file}"
  $SUDO systemctl daemon-reload
  $SUDO systemctl enable "${SERVICE_NAME}.service" >/dev/null 2>&1 || true
  $SUDO systemctl restart "${SERVICE_NAME}.service"

  log_info "Waiting for ${SERVICE_NAME}.service to become active..."
  local is_running=false
  for i in {1..15}; do
    if systemctl is-active --quiet "${SERVICE_NAME}.service" 2>/dev/null; then
      is_running=true
      break
    fi
    sleep 1
  done

  if [ "$is_running" = true ]; then
    log_success "${SERVICE_NAME}.service is ACTIVE and RUNNING."
  else
    log_error "${SERVICE_NAME}.service failed to start. Checking journal logs:"
    $SUDO journalctl -u "${SERVICE_NAME}.service" -n 25 --no-pager || true
    exit 1
  fi

  # Configure ZKTeco ADMS Push Receiver Service
  local adms_service_file="/etc/systemd/system/${SERVICE_NAME}-adms.service"
  local adms_port="${TARGET_ADMS_PORT:-${ADMS_PORT:-8081}}"
  local adms_server_ip="${TARGET_ADMS_IP:-${ADMS_SERVER_IP:-${DETECTED_SERVER_IP}}}"

  log_info "Creating ADMS Push service unit: ${adms_service_file}"
  log_info " - Push Receiver Port: ${adms_port}"
  log_info " - Push Receiver IP  : ${adms_server_ip}"

  $SUDO tee "${adms_service_file}" > /dev/null << EOF
[Unit]
Description=HESTRA HRM - ZKTeco ADMS Push Receiver (Port ${adms_port})
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=${service_user}
WorkingDirectory=${PROJECT_DIR}
EnvironmentFile=-${PROJECT_DIR}/.env
Environment=NODE_ENV=production
Environment=ADMS_PORT=${adms_port}
Environment=ADMS_HOST=0.0.0.0
Environment=ADMS_SERVER_IP=${adms_server_ip}
Environment=PATH=${node_dir}:${PROJECT_DIR}/node_modules/.bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
ExecStart=${npm_bin} run adms:start
Restart=always
RestartSec=5
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
EOF

  $SUDO chmod 644 "${adms_service_file}"
  $SUDO systemctl daemon-reload
  $SUDO systemctl enable "${SERVICE_NAME}-adms.service" >/dev/null 2>&1 || true
  $SUDO systemctl restart "${SERVICE_NAME}-adms.service"

  if systemctl is-active --quiet "${SERVICE_NAME}-adms.service" 2>/dev/null; then
    log_success "${SERVICE_NAME}-adms.service is ACTIVE and RUNNING on port ${adms_port}."
  else
    log_warn "${SERVICE_NAME}-adms.service failed to start. Checking journal logs:"
    $SUDO journalctl -u "${SERVICE_NAME}-adms.service" -n 25 --no-pager || true
  fi
}

# If --service-only was passed, configure service and exit
if [ "$SERVICE_ONLY" = true ]; then
  configure_service
  exit 0
fi

# ==============================================================================
# STEP 1: Pre-Flight Hardware & Resource Requirements Check
# ==============================================================================
check_system_resources

# ==============================================================================
# STEP 2: OS Packages & Native Build Tools
# ==============================================================================
if [ "$SKIP_DEPS" = false ]; then
  install_system_dependencies
  install_nodejs_runtime
else
  log_info "Skipping system dependencies installation (--skip-deps)."
fi

# ==============================================================================
# STEP 3: Environment Variables (.env)
# ==============================================================================
log_step "Configuring Environment (.env)"

app_port="${TARGET_PORT:-3000}"
app_host="127.0.0.1"
if [ "$USE_NGINX" = false ]; then
  app_host="0.0.0.0"
fi

cur_adms_ip="${TARGET_ADMS_IP:-$DETECTED_SERVER_IP}"
cur_adms_port="${TARGET_ADMS_PORT:-8081}"

if [ ! -f "${PROJECT_DIR}/.env" ]; then
  if [ -f "${PROJECT_DIR}/.env.example" ]; then
    cp "${PROJECT_DIR}/.env.example" "${PROJECT_DIR}/.env"
    log_info "Created .env from .env.example"
  else
    local auto_secret
    auto_secret="$(openssl rand -hex 32 2>/dev/null || tr -dc 'A-Za-z0-9' </dev/urandom 2>/dev/null | head -c 48 || echo "cambodia_hrms_super_secure_secret_token_2026_hestrahrm")"
    cat << EOF > "${PROJECT_DIR}/.env"
PORT=${app_port}
HOST=${app_host}
NODE_ENV=production
AUTH_SECRET=${auto_secret}
DATABASE_URL=postgresql://hrm_user:hrm_password@127.0.0.1:5432/hrm_db
DATABASE_PATH=data/hr.db
ADMS_PORT=${cur_adms_port}
ADMS_HOST=0.0.0.0
ADMS_SERVER_IP=${cur_adms_ip}
SESSION_MAX_AGE_DAYS=7
DEFAULT_LANGUAGE=en
DEFAULT_TIMEZONE=Asia/Phnom_Penh
DEFAULT_KHR_USD_EXCHANGE_RATE=4100
DEFAULT_COMPANY_NAME="HESTRA-GLOVES HRM (Cambodia) Ltd"
EOF
    log_info "Generated default .env configuration file."
  fi
fi

# Override DATABASE_URL if custom external URL supplied
if [ -n "$CUSTOM_DB_URL" ]; then
  if grep -q "^DATABASE_URL=" "${PROJECT_DIR}/.env"; then
    sed -i "s|^DATABASE_URL=.*|DATABASE_URL=${CUSTOM_DB_URL}|" "${PROJECT_DIR}/.env"
  else
    echo "DATABASE_URL=${CUSTOM_DB_URL}" >> "${PROJECT_DIR}/.env"
  fi
  log_info "Configured custom DATABASE_URL in .env"
elif ! grep -q "^DATABASE_URL=" "${PROJECT_DIR}/.env"; then
  echo "DATABASE_URL=postgresql://hrm_user:hrm_password@127.0.0.1:5432/hrm_db" >> "${PROJECT_DIR}/.env"
  log_info "Added default DATABASE_URL to .env"
fi

# Ensure DATABASE_PATH is present in .env
if ! grep -q "^DATABASE_PATH=" "${PROJECT_DIR}/.env"; then
  echo "DATABASE_PATH=data/hr.db" >> "${PROJECT_DIR}/.env"
  log_info "Added DATABASE_PATH to .env"
fi

# Configure ADMS Server IP in .env
if [ -n "$TARGET_ADMS_IP" ]; then
  if grep -q "^ADMS_SERVER_IP=" "${PROJECT_DIR}/.env"; then
    sed -i "s/^ADMS_SERVER_IP=.*/ADMS_SERVER_IP=${TARGET_ADMS_IP}/" "${PROJECT_DIR}/.env"
  else
    echo "ADMS_SERVER_IP=${TARGET_ADMS_IP}" >> "${PROJECT_DIR}/.env"
  fi
  cur_adms_ip="${TARGET_ADMS_IP}"
elif ! grep -q "^ADMS_SERVER_IP=" "${PROJECT_DIR}/.env"; then
  echo "ADMS_SERVER_IP=${cur_adms_ip}" >> "${PROJECT_DIR}/.env"
  log_info "Added auto-detected ADMS_SERVER_IP=${cur_adms_ip} to .env"
else
  cur_adms_ip=$(grep "^ADMS_SERVER_IP=" "${PROJECT_DIR}/.env" | cut -d'=' -f2- | tr -d ' "' || echo "$cur_adms_ip")
fi

# Configure ADMS Port in .env
if [ -n "$TARGET_ADMS_PORT" ]; then
  if grep -q "^ADMS_PORT=" "${PROJECT_DIR}/.env"; then
    sed -i "s/^ADMS_PORT=.*/ADMS_PORT=${TARGET_ADMS_PORT}/" "${PROJECT_DIR}/.env"
  else
    echo "ADMS_PORT=${TARGET_ADMS_PORT}" >> "${PROJECT_DIR}/.env"
  fi
  cur_adms_port="${TARGET_ADMS_PORT}"
elif ! grep -q "^ADMS_PORT=" "${PROJECT_DIR}/.env"; then
  echo "ADMS_PORT=${cur_adms_port}" >> "${PROJECT_DIR}/.env"
  log_info "Added ADMS_PORT=${cur_adms_port} to .env"
else
  cur_adms_port=$(grep "^ADMS_PORT=" "${PROJECT_DIR}/.env" | cut -d'=' -f2- | tr -d ' "' || echo "$cur_adms_port")
fi

# Ensure ADMS_HOST is present
if ! grep -q "^ADMS_HOST=" "${PROJECT_DIR}/.env"; then
  echo "ADMS_HOST=0.0.0.0" >> "${PROJECT_DIR}/.env"
fi

# Auto-generate secure AUTH_SECRET if still using the default placeholder
if grep -q "^AUTH_SECRET=cambodia_hrms_super_secure_secret_token_2026_hestrahrm" "${PROJECT_DIR}/.env"; then
  local new_secret
  new_secret="$(openssl rand -hex 32 2>/dev/null || tr -dc 'A-Za-z0-9' </dev/urandom 2>/dev/null | head -c 48 || true)"
  if [ -n "$new_secret" ]; then
    sed -i "s/^AUTH_SECRET=.*/AUTH_SECRET=${new_secret}/" "${PROJECT_DIR}/.env"
    log_info "Generated unique production AUTH_SECRET in .env"
  fi
fi

# Ensure DEFAULT_LANGUAGE=en is present in .env
if ! grep -q "^DEFAULT_LANGUAGE=" "${PROJECT_DIR}/.env"; then
  echo "DEFAULT_LANGUAGE=en" >> "${PROJECT_DIR}/.env"
fi

# Override PORT in .env if specified via argument or Nginx setup
if grep -q "^PORT=" "${PROJECT_DIR}/.env"; then
  sed -i "s/^PORT=.*/PORT=${app_port}/" "${PROJECT_DIR}/.env"
else
  echo "PORT=${app_port}" >> "${PROJECT_DIR}/.env"
fi

# Override HOST in .env
if grep -q "^HOST=" "${PROJECT_DIR}/.env"; then
  sed -i "s/^HOST=.*/HOST=${app_host}/" "${PROJECT_DIR}/.env"
else
  echo "HOST=${app_host}" >> "${PROJECT_DIR}/.env"
fi
log_info "Configured PORT=${app_port} and HOST=${app_host} in .env"

# Source .env into current shell for database and port settings
set -a
# shellcheck disable=SC1091
source "${PROJECT_DIR}/.env" 2>/dev/null || true
set +a

# ==============================================================================
# STEP 4: PostgreSQL Server Provisioning & Verification
# ==============================================================================
if [ "$SKIP_PG" = false ]; then
  setup_postgresql_service
else
  log_info "Skipping local PostgreSQL server setup (--skip-pg)."
fi

# ==============================================================================
# STEP 5: Node.js Packages & Native Addon Rebuild
# ==============================================================================
install_node_packages

# If --deps-only was passed, exit here with full success!
if [ "$DEPS_ONLY" = true ]; then
  echo -e "\n${C_GREEN}${C_BOLD}"
  echo "=================================================================="
  echo "    ALL DEPENDENCY REQUIREMENTS INSTALLED & VERIFIED SUCCESSFULLY!"
  echo "=================================================================="
  echo -e "${C_RESET}"
  log_info "System build tools, PostgreSQL, Node.js, and npm packages are ready."
  log_info "To build and launch the application, run: sudo ./setup.sh"
  exit 0
fi

# ==============================================================================
# STEP 6: Database Setup & Data Application
# ==============================================================================
apply_database_data

# ==============================================================================
# STEP 7: Next.js Production Build
# ==============================================================================
if [ "$SKIP_BUILD" = false ]; then
  log_step "Building Next.js Production Bundle (npm run build)"
  log_info "Compiling TypeScript, App Router routes, and Tailwind CSS assets..."
  export NODE_OPTIONS="--max-old-space-size=2048"
  npm run build
  log_success "Production build completed successfully."
else
  log_info "Skipping Next.js build (--skip-build)."
fi

# ==============================================================================
# STEP 8: Nginx Reverse Proxy Setup
# ==============================================================================
setup_nginx_reverse_proxy

# ==============================================================================
# STEP 9: Security (Host Firewall & Fail2ban)
# ==============================================================================
setup_ufw_firewall
setup_fail2ban

# ==============================================================================
# STEP 10: Services Setup (systemd)
# ==============================================================================
if [ "$SKIP_SERVICE" = false ]; then
  configure_service
else
  log_info "Skipping systemd service configuration (--skip-service)."
fi

# ==============================================================================
# STEP 11: Health Check & Verification
# ==============================================================================
log_step "Performing Health Check"

HEALTHY=false
HTTP_CODE="000"

if command -v curl >/dev/null 2>&1; then
  log_info "Testing connection to internal service (http://127.0.0.1:${app_port})..."
  for i in {1..10}; do
    HTTP_CODE="$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${app_port}" || echo "000")"
    if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 302 ] || [ "$HTTP_CODE" -eq 307 ]; then
      HEALTHY=true
      break
    fi
    sleep 1
  done
fi

ADMS_HEALTHY=false
ADMS_HTTP_CODE="000"
if command -v curl >/dev/null 2>&1; then
  log_info "Testing connection to ADMS push receiver (http://127.0.0.1:${cur_adms_port}/health)..."
  for i in {1..5}; do
    ADMS_HTTP_CODE="$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${cur_adms_port}/health" || echo "000")"
    if [ "$ADMS_HTTP_CODE" -eq 200 ]; then
      ADMS_HEALTHY=true
      break
    fi
    sleep 1
  done
fi

SERVER_IP="${DETECTED_SERVER_IP:-127.0.0.1}"

echo -e "\n${C_GREEN}${C_BOLD}"
echo "=================================================================="
echo "    HESTRAHRM System Setup & Deployment Completed Successfully!   "
echo "=================================================================="
echo -e "${C_RESET}"

if [ "$HEALTHY" = true ]; then
  echo -e "Web App Status : ${C_GREEN}HEALTHY & RESPONDING${C_RESET} (HTTP ${HTTP_CODE})"
else
  echo -e "Web App Status : ${C_YELLOW}INITIALIZING${C_RESET} (May take a few more seconds)"
fi

if [ "$ADMS_HEALTHY" = true ]; then
  echo -e "ADMS Receiver  : ${C_GREEN}HEALTHY & LISTENING${C_RESET} (Port ${cur_adms_port})"
else
  echo -e "ADMS Receiver  : ${C_YELLOW}INITIALIZING${C_RESET} (Port ${cur_adms_port})"
fi

if [ "$USE_NGINX" = true ]; then
  if [ -n "$DOMAIN_NAME" ] && [ "$DOMAIN_NAME" != "_" ]; then
    echo -e "Public Web URL : ${C_CYAN}https://${DOMAIN_NAME}${C_RESET} (or http://${DOMAIN_NAME})"
  else
    echo -e "Public Web URL : ${C_CYAN}http://${SERVER_IP}${C_RESET}"
  fi
  echo -e "Internal App   : ${C_CYAN}http://127.0.0.1:${app_port}${C_RESET}"
else
  echo -e "Application URL: ${C_CYAN}http://${SERVER_IP}:${app_port}${C_RESET}"
fi

echo -e "ADMS Push URL  : ${C_CYAN}http://${cur_adms_ip}:${cur_adms_port}/iclock/cdata${C_RESET}"
echo -e "Database       : PostgreSQL (${DATABASE_URL:-postgresql://hrm_user:hrm_password@127.0.0.1:5432/hrm_db})"

echo -e "\n${C_BOLD}Default Login Personas / Accounts:${C_RESET}"
echo -e " - ${C_BOLD}Admin${C_RESET}       : Username: ${C_CYAN}admin${C_RESET}   | Password: ${C_CYAN}@9218njo0(TWp<3q\"(3{${C_RESET}"
echo -e " - ${C_BOLD}CEO${C_RESET}         : Username: ${C_CYAN}ceo${C_RESET}     | Password: ${C_CYAN}@9218njo0(TWp<3q\"(3{${C_RESET}"
echo -e " - ${C_BOLD}IT Support${C_RESET}  : Username: ${C_CYAN}sitha${C_RESET}   | Password: ${C_CYAN}@9218njo0(TWp<3q\"(3{${C_RESET}"
echo -e " - ${C_BOLD}Staff${C_RESET}       : Username: ${C_CYAN}vichet${C_RESET}  | Password: ${C_CYAN}@9218njo0(TWp<3q\"(3{${C_RESET}"

echo -e "\n${C_BOLD}Useful Service Commands:${C_RESET}"
echo -e " - View app logs     : ${C_CYAN}journalctl -u ${SERVICE_NAME}.service -f${C_RESET}"
echo -e " - View ADMS logs    : ${C_CYAN}journalctl -u ${SERVICE_NAME}-adms.service -f${C_RESET}"
echo -e " - Check status      : ${C_CYAN}systemctl status ${SERVICE_NAME}.service ${SERVICE_NAME}-adms.service nginx fail2ban${C_RESET}"
echo -e " - Restart services  : ${C_CYAN}systemctl restart ${SERVICE_NAME}.service ${SERVICE_NAME}-adms.service${C_RESET}"
echo -e " - Re-apply DB data  : ${C_CYAN}npm run db:apply${C_RESET}"
echo -e " - Dump latest DB    : ${C_CYAN}npm run db:dump${C_RESET}"
echo -e " - Verify deps       : ${C_CYAN}./setup.sh --check-deps${C_RESET}"
echo "=================================================================="
