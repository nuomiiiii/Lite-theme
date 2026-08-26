export function GetOsName(platform: string): string {
  const p = (platform || "").toLowerCase().trim()
  const proper = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

  const direct = new Set([
    "almalinux",
    "alpine",
    "aosc",
    "apple",
    "archlinux",
    "archlabs",
    "artix",
    "budgie",
    "centos",
    "coreos",
    "debian",
    "deepin",
    "devuan",
    "docker",
    "fedora",
    "ferris",
    "flathub",
    "freebsd",
    "gentoo",
    "gnu-guix",
    "illumos",
    "linuxmint",
    "mageia",
    "mandriva",
    "manjaro",
    "nixos",
    "openbsd",
    "opensuse",
    "pop-os",
    "redhat",
    "sabayon",
    "slackware",
    "snappy",
    "solus",
    "tux",
    "ubuntu",
    "void",
    "zorin",
  ])
  if (direct.has(p)) return proper(p)

  if (p === "darwin" || p.includes("mac os") || p.includes("macos") || p.includes("apple")) return "macOS"
  if (p.includes("windows") || p.startsWith("win")) return "Windows"
  if (p === "amazon" || p.includes("amazon linux") || p.includes("rhel") || p.includes("red hat")) return "Redhat"
  if (p === "arch" || p.includes("arch linux") || p.includes("archlinux")) return "Archlinux"
  if (p.includes("opensuse") || p.includes("suse")) return "Opensuse"
  if (p.includes("debian")) return "Debian"
  if (p.includes("ubuntu")) return "Ubuntu"
  if (p.includes("alpine")) return "Alpine"
  if (p.includes("centos")) return "Centos"
  if (p.includes("rocky")) return "Rocky Linux"
  if (p.includes("fedora")) return "Fedora"
  if (p.includes("manjaro")) return "Manjaro"
  if (p.includes("kali")) return "Kali Linux"
  if (p.includes("mint")) return "Linux Mint"
  if (p.includes("nixos")) return "NixOS"
  if (p.includes("raspbian") || p.includes("raspberry")) return "Raspberry Pi OS"
  if (p.includes("freebsd")) return "FreeBSD"
  if (p.includes("openbsd")) return "OpenBSD"
  if (p.includes("gentoo")) return "Gentoo"
  if (p.includes("deepin")) return "Deepin"
  if (p.includes("elementary")) return "elementaryOS"
  if (p.includes("void")) return "Void"
  if (p.includes("zorin")) return "Zorin"

  if (p.includes("openwrt") || p.includes("immortalwrt") || p.includes("linux")) return "Linux"

  return "Linux"
}
