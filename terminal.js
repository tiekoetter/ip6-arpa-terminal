document.documentElement.classList.replace("no-js", "js");

const zone = "0.1.5.c.4.5.9.0.a.2.ip6.arpa";
const httpsMirrorZone = "0.1.5.c.4.5.9.0.a.2.ip6arpa.com";
const ipv6PrefixNibbles = [
  ...zone.slice(0, -".ip6.arpa".length).split("."),
].reverse();
const ipv6PrefixAddress = formatIpv6Address(
  ipv6PrefixNibbles.join("").padEnd(32, "0"),
);
const ipv6Prefix = `${ipv6PrefixAddress}/${ipv6PrefixNibbles.length * 4}`;
const host = `www.${zone}`;
const httpsMirrorHost = `www.${httpsMirrorZone}`;
const httpSiteUrl = `http://${host}/`;
const httpsSiteUrl = `https://${httpsMirrorHost}/`;
const historyTransferParameter = "terminal-history";
const historyTransferEntryLimit = 50;
const historyTransferLengthLimit = 4000;
const browserHostname = window.location.hostname.toLowerCase().replace(/\.$/, "");
const isHttpsMirror = [httpsMirrorZone, httpsMirrorHost].includes(browserHostname);
const shellDomain = isHttpsMirror ? httpsMirrorZone : zone;
const siteHost = isHttpsMirror ? httpsMirrorHost : host;
const siteProtocol = isHttpsMirror ? "HTTPS" : "HTTP";
const contactName = "Léon Tiekötter";
const contactEmail = "leon@tiekoetter.com";
const zoneContactEmail = `leon@${zone}`;
const motdContactEmail = `root@${zone}`;
const asPageUrl = "https://as208694.net/";
const impressumUrl = "https://www.tiekoetter.com/impressum/";
const linkedTextTargets = new Map([
  [httpSiteUrl, httpSiteUrl],
  [httpsSiteUrl, httpsSiteUrl],
  [asPageUrl, asPageUrl],
  [impressumUrl, impressumUrl],
  [contactEmail, `mailto:${contactEmail}`],
  [zoneContactEmail, `mailto:${zoneContactEmail}`],
  [motdContactEmail, `mailto:${motdContactEmail}`],
]);
const linkedTextPattern = new RegExp(
  `(${[...linkedTextTargets.keys()].map(escapeRegExp).join("|")})`,
  "g",
);
const aRecords = ["152.53.125.158"];
const aaaaRecords = ["2a09:54c5:1010:443::1", "2a14:7c0:4bfc:443::1"];
const mxRecords = [{ priority: 1, exchange: "luna.sys.tiekoetter.net." }];
const mxRecordLines = mxRecords.map(
  ({ priority, exchange }) => `${priority} ${exchange}`,
);
const txtRecord = "yes, this is a website in ip6.arpa";
const nsRecords = [
  "ns1.tiekoetter.net.",
  "ns2.tiekoetter.net.",
  "ns3.tiekoetter.net.",
  "ns4.tiekoetter.net.",
];
const fetchLogoLines = [
  `${" ".repeat(1)}${"@".repeat(29)}`,
  `${" ".repeat(1)}${"@".repeat(29)}`,
  ...Array(2).fill(
    `${" ".repeat(1)}@@${" ".repeat(10)}@@@@@${" ".repeat(10)}@@`,
  ),
  ...Array(9).fill(`${" ".repeat(13)}@@@@@`),
  `${" ".repeat(12)}@@@@@@@`,
  `${" ".repeat(9)}@@@@@@@@@@@@@`,
];
const soaRecord = {
  mname: "ns1.tiekoetter.net.",
  rname: "dns.tiekoetter.net.",
  serial: "2026061104",
  refresh: "43200",
  retry: "7200",
  expire: "2419200",
  minimum: "86400",
};

const terminal = document.querySelector("#terminal");
const initialMotd = document.querySelector("#initial-motd");
const form = document.querySelector("#command-form");
const prompt = document.querySelector(".prompt");
const input = document.querySelector("#command-input");
const cursor = document.querySelector("#block-cursor");
const cursorCanvas = document.createElement("canvas");
const cursorContext = cursorCanvas.getContext("2d");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

prompt.textContent = `guest@${shellDomain}:~$`;

const history = restoreTransferredHistory();
let historyIndex = history.length;
let isBooting = false;
let skipBootRequested = false;
let bootStartedAt = performance.now();

const bootLines = [
  `querying ${siteHost}`,
  `A record found:    ${aRecords.join(", ")}`,
  `AAAA records found: ${aaaaRecords.join(", ")}`,
  `${siteProtocol} endpoint reachable ........... ok`,
  "loading terminal interface ......... ok",
  `connected as guest@${shellDomain}`,
  "",
];

const motdBoxContent = formatPanelContent([
  { text: "RDNS TERMINAL", align: "center" },
  "",
  `Website: ${siteHost}`,
  `Zone:    ${zone}`,
  `TXT:     "${txtRecord}"`,
]);
const motdFooter = [
  "Yes, this is a website in ip6.arpa—the namespace for IPv6 reverse DNS.",
  "Use the terminal to explore its zone, DNS records, reverse names, and public allocation details.",
  "",
  `AS208694: ${asPageUrl}`,
  `Legal notice: ${impressumUrl}`,
  `System administrator: ${motdContactEmail}`,
  "",
  'Type "help" for available commands.',
].join("\n");
const motd = `${motdBoxContent}\n\n${motdFooter}`;

initialMotd.querySelector(".motd-box").textContent = motdBoxContent;
const initialMotdFooter = initialMotd.querySelector(".motd-footer");
initialMotdFooter.replaceChildren();
appendLinkedText(initialMotdFooter, motdFooter);

const fileContents = {
  "motd.txt": () => motd,
  "zone.txt": () => commands.zone(),
  "whois.txt": () => commands.whois(),
  "dns-records.txt": () => commands.dig(),
  "dig.log": () => commands.dig(),
};

const commands = {
  help() {
    return [
      "Available commands:",
      "  help      Show this command list",
      "  zone      Print the reverse DNS zone",
      "  whois     Show public allocation details",
      "  dig       Show configured DNS records",
      "  decode ... Decode an IPv4 or IPv6 reverse DNS name",
      "  arpa ADDR Convert an IP address to its reverse DNS name",
      "  tls       Explain the HTTPS situation",
      "  https     Alias for tls",
      "  goto http Switch to the canonical HTTP site",
      "  goto https Switch to the canonical HTTPS mirror",
      "  contact   Print contact details",
      "  email     Show the zone's contact email and MX record",
      "  fetch     Show system information",
      "  host      Print the current hostname",
      "  ls        List this tiny filesystem",
      "  cat FILE  Print one of the listed files",
      "  pwd       Print working directory",
      "  whoami    Print current user",
      "  sudo ...  Attempt to run a command as root",
      "  motd      Print the banner again",
      "  date      Print the browser's local time",
      "  uptime    Show the time since the last boot",
      "  history   Show command history",
      "  reboot    Restart the terminal",
      "  clear     Clear the terminal",
      "  echo ...  Echo text back",
    ].join("\n");
  },

  zone() {
    return [
      `zone: ${zone}`,
      `host: ${host}`,
      `soa:  ${soaRecord.mname} ${soaRecord.rname} ${soaRecord.serial}`,
      `ns:   ${nsRecords.join(" ")}`,
      `mx:   ${mxRecordLines.join(" ")}`,
      `txt:  "${txtRecord}"`,
      "",
      "This name is under ip6.arpa, the namespace for IPv6 reverse DNS.",
    ].join("\n");
  },

  whois() {
    return [
      "% IANA",
      "inet6num:     2a00::/12",
      "organisation: RIPE NCC",
      "status:       ALLOCATED",
      "whois:        whois.ripe.net",
      "changed:      2006-10-03",
      "",
      "% RIPE",
      "inet6num:     2a09:54c5:1000::/40",
      "netname:      TIEKOETTERNET-GLOBAL-SERVICES",
      "descr:        Tiekoetter.NET Global Services",
      "country:      DE",
      "org:          ORG-TIEK1-RIPE",
      "status:       ALLOCATED-BY-LIR",
      "mnt-by:       HYEHOST-MNT",
      "created:      2026-06-07T23:57:10Z",
      "last-modified: 2026-06-09T19:29:13Z",
      "abuse-mailbox: abuse@tiekoetter.net",
      "geofeed:      https://www.as.tiekoetter.net/geofeed.csv",
      "remarks:      Refer to prefixes.as208694.net for current prefix usage and allocations.",
      "",
      "% route6",
      "route6:       2a09:54c5:1000::/40",
      "origin:       AS208694",
    ].join("\n");
  },

  dig() {
    return [
      `$ dig +short A ${host}`,
      ...aRecords,
      "",
      `$ dig +short AAAA ${host}`,
      ...aaaaRecords,
      "",
      `$ dig +short NS ${zone}`,
      ...nsRecords,
      "",
      `$ dig +short MX ${zone}`,
      ...mxRecordLines,
      "",
      `$ dig +short SOA ${zone}`,
      [
        soaRecord.mname,
        soaRecord.rname,
        soaRecord.serial,
        soaRecord.refresh,
        soaRecord.retry,
        soaRecord.expire,
        soaRecord.minimum,
      ].join(" "),
      "",
      `$ dig +short TXT ${host}`,
      `"${txtRecord}"`,
    ].join("\n");
  },

  decode(args) {
    if (args.length > 1) {
      return "decode: too many arguments\nUsage: decode [NAME]";
    }

    const name = args[0] ?? zone;
    const decoded = decodeReverseDnsName(name);
    if (!decoded) {
      return `decode: ${name}: Invalid or unsupported reverse DNS name`;
    }

    return [
      `name:    ${decoded.name}`,
      `reverse: ${decoded.components.join(" ")}`,
      `prefix:  ${decoded.prefix}`,
      "",
      `${decoded.namespace} stores ${decoded.addressFamily} addresses one ` +
        `${decoded.unit} at a time,`,
      "in reverse order.",
    ].join("\n");
  },

  arpa(args) {
    if (!args.length) {
      return "arpa: missing IP address\nUsage: arpa ADDR";
    }

    if (args.length > 1) {
      return "arpa: too many arguments\nUsage: arpa ADDR";
    }

    const arpaName = addressToArpa(args[0]);
    if (!arpaName) {
      return `arpa: ${args[0]}: Invalid IP address`;
    }

    return arpaName;
  },

  motd() {
    return motd;
  },

  tls() {
    return [
      "The original ip6.arpa host deliberately uses plain HTTP.",
      "",
      "Public CAs do not currently issue certificates for .arpa names that",
      "mainstream browsers trust.",
      "",
      "A browser-trusted HTTPS mirror is available at:",
      `  ${httpsSiteUrl}`,
      "",
      'Use "goto https" for the mirror or "goto http" for the original.',
      "",
      `If you know of a CA that does, or represent one, email ${contactEmail}.`,
    ].join("\n");
  },

  https() {
    return commands.tls();
  },

  goto(args) {
    if (!args.length) {
      return "goto: missing destination\nUsage: goto <http|https>";
    }

    if (args.length > 1) {
      return "goto: too many arguments\nUsage: goto <http|https>";
    }

    const destinations = {
      http: httpSiteUrl,
      https: httpsSiteUrl,
    };
    const destination = destinations[args[0].toLowerCase()];

    if (!destination) {
      return `goto: ${args[0]}: Unknown destination\nUsage: goto <http|https>`;
    }

    window.location.assign(createHistoryTransferUrl(destination));
    return `Connecting to ${destination}`;
  },

  contact() {
    return [
      "Contact:",
      `  ${contactName}`,
      `  ${contactEmail}`,
      "",
      "Especially welcome: information about a public CA that issues",
      "browser-trusted certificates for .arpa names, including messages from",
      "the CA itself.",
    ].join("\n");
  },

  email() {
    return [
      `Email: ${zoneContactEmail}`,
      "",
      "This address uses the ip6.arpa zone itself as its mail domain.",
      "The zone also publishes an MX record directing email to:",
      ...mxRecordLines.map((record) => `  ${record}`),
    ].join("\n");
  },

  fetch() {
    return formatFetchOutput();
  },

  host() {
    return siteHost;
  },

  ls() {
    return Object.keys(fileContents).join("  ");
  },

  cat(args) {
    if (!args.length) {
      return "cat: missing file operand";
    }

    return args
      .map((fileName) => {
        if (!Object.hasOwn(fileContents, fileName)) {
          return `cat: ${fileName}: No such file`;
        }

        return fileContents[fileName]();
      })
      .join("\n\n");
  },

  pwd() {
    return `/srv/www/${siteHost}`;
  },

  whoami() {
    return "guest";
  },

  sudo() {
    return [
      "guest is not in the sudoers file. This incident will be reported.",
      `${motdContactEmail} was contacted.`,
    ].join("\n");
  },

  date() {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "full",
      timeStyle: "long",
    }).format(new Date());
  },

  uptime() {
    return `up ${formatDuration(performance.now() - bootStartedAt)}`;
  },

  history() {
    const width = String(history.length).length;
    return history
      .map(
        (command, index) =>
          `${String(index + 1).padStart(width, " ")}  ${command}`,
      )
      .join("\n");
  },

  reboot() {
    history.length = 0;
    historyIndex = 0;
    terminal.replaceChildren();
    bootTerminal();
    return "";
  },

  clear() {
    terminal.replaceChildren();
    return "";
  },
};

function addressToArpa(address) {
  const ipv4Octets = parseIpv4Address(address.trim());
  if (ipv4Octets) {
    return `${[...ipv4Octets].reverse().join(".")}.in-addr.arpa.`;
  }

  return ipv6ToArpa(address);
}

function ipv6ToArpa(address) {
  const expandedAddress = expandIpv6Address(address);
  if (!expandedAddress) return null;

  return `${[...expandedAddress].reverse().join(".")}.ip6.arpa.`;
}

function expandIpv6Address(input) {
  let address = input.trim().toLowerCase();
  if (!address || address.includes("%") || address.includes("/")) return null;

  if (address.includes(".")) {
    const lastColon = address.lastIndexOf(":");
    if (lastColon === -1) return null;

    const octets = parseIpv4Address(address.slice(lastColon + 1));
    if (!octets) return null;

    const high = (octets[0] << 8) | octets[1];
    const low = (octets[2] << 8) | octets[3];
    address = `${address.slice(0, lastColon + 1)}${high.toString(16)}:${low.toString(16)}`;
  }

  const halves = address.split("::");
  if (halves.length > 2) return null;

  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const groups = [...left, ...right];

  if (groups.some((group) => !/^[0-9a-f]{1,4}$/.test(group))) return null;

  if (halves.length === 1) {
    if (groups.length !== 8) return null;
    return groups.map((group) => group.padStart(4, "0")).join("");
  }

  const missingGroups = 8 - groups.length;
  if (missingGroups < 1) return null;

  return [...left, ...Array(missingGroups).fill("0"), ...right]
    .map((group) => group.padStart(4, "0"))
    .join("");
}

function parseIpv4Address(address) {
  const octets = address.split(".");
  if (octets.length !== 4 || octets.some((octet) => !isValidIpv4Octet(octet))) {
    return null;
  }

  return octets.map(Number);
}

function isValidIpv4Octet(octet) {
  return /^(0|[1-9]\d{0,2})$/.test(octet) && Number(octet) <= 255;
}

function decodeReverseDnsName(input) {
  const name = input.trim().toLowerCase().replace(/\.$/, "");

  if (name.endsWith(".ip6.arpa")) {
    const labels = name.slice(0, -".ip6.arpa".length).split(".");
    if (
      labels.length > 32 ||
      labels.some((label) => !/^[0-9a-f]$/.test(label))
    ) {
      return null;
    }

    const components = [...labels].reverse();
    const address = formatIpv6Address(components.join("").padEnd(32, "0"));
    return {
      name,
      components,
      prefix: `${address}/${components.length * 4}`,
      namespace: "ip6.arpa",
      addressFamily: "IPv6",
      unit: "hexadecimal nibble",
    };
  }

  if (name.endsWith(".in-addr.arpa")) {
    const labels = name.slice(0, -".in-addr.arpa".length).split(".");
    if (
      labels.length > 4 ||
      labels.some((label) => !isValidIpv4Octet(label))
    ) {
      return null;
    }

    const components = [...labels].reverse();
    const address = [...components, ...Array(4 - components.length).fill("0")]
      .join(".");
    return {
      name,
      components,
      prefix: `${address}/${components.length * 8}`,
      namespace: "in-addr.arpa",
      addressFamily: "IPv4",
      unit: "octet",
    };
  }

  return null;
}

function formatIpv6Address(expandedAddress) {
  const groups = expandedAddress
    .match(/.{4}/g)
    .map((group) => Number.parseInt(group, 16).toString(16));
  let longestStart = -1;
  let longestLength = 0;

  for (let start = 0; start < groups.length; start += 1) {
    if (groups[start] !== "0") continue;

    let end = start;
    while (end < groups.length && groups[end] === "0") end += 1;

    if (end - start > longestLength) {
      longestStart = start;
      longestLength = end - start;
    }

    start = end - 1;
  }

  if (longestLength < 2) return groups.join(":");

  const before = groups.slice(0, longestStart).join(":");
  const after = groups.slice(longestStart + longestLength).join(":");
  return `${before}::${after}`;
}

function formatDuration(milliseconds) {
  let remainingSeconds = Math.floor(milliseconds / 1000);
  const units = [
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
    ["second", 1],
  ];
  const parts = [];

  for (const [name, seconds] of units) {
    const value = Math.floor(remainingSeconds / seconds);
    if (!value && (name !== "second" || parts.length)) continue;

    parts.push(`${value} ${name}${value === 1 ? "" : "s"}`);
    remainingSeconds %= seconds;
  }

  return parts.join(", ");
}

function formatFetchOutput() {
  const title = `guest@${shellDomain}`;
  const details = [
    title,
    "-".repeat(title.length),
    `Host:     ${siteHost}`,
    `Zone:     ${zone}`,
    `Prefix:   ${ipv6Prefix}`,
    "ASN:      208694",
    `IPv4:     ${aRecords.join(", ")}`,
    `IPv6:     ${aaaaRecords[0]}`,
    `          ${aaaaRecords[1]}`,
    "Shell:    bash (simulated)",
    "Terminal: ip6-arpa-terminal",
    `Uptime:   ${formatDuration(performance.now() - bootStartedAt)}`,
  ];

  if (window.matchMedia("(max-width: 640px)").matches) {
    return [...fetchLogoLines, "", ...details].join("\n");
  }

  const logoWidth = Math.max(...fetchLogoLines.map((line) => line.length));
  return fetchLogoLines
    .map((line, index) => {
      const detail = details[index] ?? "";
      return detail ? `${line.padEnd(logoWidth, " ")}    ${detail}` : line;
    })
    .join("\n");
}

function formatPanelContent(lines) {
  const normalizedLines = lines.map((line) => {
    if (typeof line === "string") {
      return { text: line, align: "left" };
    }

    return line;
  });

  const width = Math.max(...normalizedLines.map((line) => line.text.length));
  return normalizedLines.map(({ text, align }) => {
    if (align !== "center") {
      return text.padEnd(width, " ");
    }

    const leftPadding = Math.floor((width - text.length) / 2);
    const rightPadding = width - text.length - leftPadding;
    return `${" ".repeat(leftPadding)}${text}${" ".repeat(rightPadding)}`;
  }).join("\n");
}

function appendBlock(text, className = "") {
  if (!text) return;

  if (text === motd) {
    appendMotd(className);
    return;
  }

  const block = document.createElement("pre");
  if (className) block.className = className;

  appendLinkedText(block, text);
  terminal.append(block);
  scrollTerminalToBottom();
}

function appendMotd(className = "") {
  if (initialMotd && !initialMotd.isConnected) {
    initialMotd.className = ["motd-output", className]
      .filter(Boolean)
      .join(" ");
    terminal.append(initialMotd);
    scrollTerminalToBottom();
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.className = ["motd-output", className].filter(Boolean).join(" ");

  const box = document.createElement("pre");
  box.className = "motd-box";
  box.textContent = motdBoxContent;

  const footer = document.createElement("pre");
  footer.className = "motd-footer";
  appendLinkedText(footer, motdFooter);

  wrapper.append(box, footer);
  terminal.append(wrapper);
  scrollTerminalToBottom();
}

function appendLinkedText(element, text) {
  for (const part of text.split(linkedTextPattern)) {
    if (linkedTextTargets.has(part)) {
      const target = linkedTextTargets.get(part);
      const link = document.createElement("a");
      link.href = target;
      link.textContent = part;
      if (target.startsWith("http")) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
      element.append(link);
    } else {
      element.append(document.createTextNode(part));
    }
  }
}

function scrollTerminalToBottom() {
  terminal.scrollTop = terminal.scrollHeight;
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function createHistoryTransferUrl(destination) {
  const destinationUrl = new URL(destination);
  const fragment = new URLSearchParams(destinationUrl.hash.slice(1));
  let transferredHistory = history.slice(-historyTransferEntryLimit);

  while (
    transferredHistory.length > 1 &&
    encodeURIComponent(JSON.stringify(transferredHistory)).length >
      historyTransferLengthLimit
  ) {
    transferredHistory.shift();
  }

  fragment.set(historyTransferParameter, JSON.stringify(transferredHistory));
  destinationUrl.hash = fragment.toString();
  return destinationUrl.href;
}

function restoreTransferredHistory() {
  const fragment = new URLSearchParams(window.location.hash.slice(1));
  const serializedHistory = fragment.get(historyTransferParameter);
  if (serializedHistory === null) return [];

  fragment.delete(historyTransferParameter);
  const cleanUrl = new URL(window.location.href);
  cleanUrl.hash = fragment.toString();
  window.history.replaceState(null, "", cleanUrl);

  try {
    const restoredHistory = JSON.parse(serializedHistory);
    if (
      !Array.isArray(restoredHistory) ||
      restoredHistory.some((command) => typeof command !== "string")
    ) {
      return [];
    }

    return restoredHistory.slice(-historyTransferEntryLimit);
  } catch {
    return [];
  }
}

function appendPrompt(command) {
  appendBlock(`guest@${shellDomain}:~$ ${command}`, "output-command");
}

function runCommand(rawCommand) {
  const trimmed = rawCommand.trim();
  if (!trimmed) return;

  const [name, ...args] = trimmed.split(/\s+/);
  const command = name.toLowerCase();

  appendPrompt(trimmed);

  if (command === "echo") {
    appendBlock(args.join(" "));
    return;
  }

  if (Object.hasOwn(commands, command)) {
    appendBlock(commands[command](args), command === "fetch" ? "fetch-output" : "");
    return;
  }

  appendBlock(
    `${name}: command not found\nTry "help" for a list of available commands.`,
    "output-error",
  );
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (input.disabled) return;

  const command = input.value;
  input.value = "";

  if (command.trim()) {
    history.push(command);
    historyIndex = history.length;
  }

  runCommand(command);
  updateCursor();
});

input.addEventListener("keydown", (event) => {
  if (event.key === "ArrowUp") {
    event.preventDefault();
    historyIndex = Math.max(0, historyIndex - 1);
    input.value = history[historyIndex] ?? "";
    updateCursorSoon();
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    historyIndex = Math.min(history.length, historyIndex + 1);
    input.value = history[historyIndex] ?? "";
    updateCursorSoon();
  }
});

input.addEventListener("input", updateCursor);
input.addEventListener("click", updateCursor);
input.addEventListener("keyup", updateCursor);
input.addEventListener("scroll", updateCursor);
input.addEventListener("focus", updateCursor);
window.addEventListener("resize", updateCursor);
window.addEventListener("load", () => {
  updateCursor();
});

document.addEventListener("click", () => {
  if (input.disabled) return;
  input.focus();
  updateCursorSoon();
});

document.addEventListener("keydown", (event) => {
  if (!isBooting || event.key !== "Enter") return;

  event.preventDefault();
  skipBootRequested = true;
});

bootTerminal();

async function bootTerminal() {
  initialMotd?.remove();
  terminal.replaceChildren();
  bootStartedAt = performance.now();
  isBooting = true;
  skipBootRequested = false;
  terminal.setAttribute("aria-live", "off");
  form.classList.add("is-booting");
  input.disabled = true;

  const bootOutput = document.createElement("div");
  bootOutput.className = "boot-output";
  terminal.append(bootOutput);

  for (const line of bootLines) {
    if (skipBootRequested) break;
    await appendBootLine(line, bootOutput);
  }

  if (!skipBootRequested) {
    await sleep(120);
  }

  if (!skipBootRequested && !prefersReducedMotion) {
    bootOutput.classList.add("is-exiting");
    await sleep(180);
  }

  const animateMotd = !skipBootRequested && !prefersReducedMotion;
  terminal.replaceChildren();
  appendBlock(
    motd,
    animateMotd ? "output-success motd-enter" : "output-success",
  );

  isBooting = false;
  terminal.setAttribute("aria-live", "polite");
  input.disabled = false;
  form.classList.remove("is-booting");
  input.focus();
  updateCursor();
}

async function appendBootLine(text, output) {
  if (skipBootRequested) return;

  if (!text) {
    await sleep(80);
    return;
  }

  const block = document.createElement("pre");
  block.className = "output-muted boot-line";
  output.append(block);

  if (prefersReducedMotion) {
    block.textContent = text;
    scrollTerminalToBottom();
    await sleep(50);
    return;
  }

  for (const character of text) {
    if (skipBootRequested) return;

    block.textContent += character;
    terminal.scrollTop = terminal.scrollHeight;
    await sleep(4);
  }

  if (skipBootRequested) return;

  await sleep(50);
}

function sleep(milliseconds) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function updateCursor() {
  const style = window.getComputedStyle(input);
  const textBeforeCursor = input.value.slice(0, input.selectionStart ?? 0);
  cursorContext.font = style.font;

  const measuredText = cursorContext.measureText(textBeforeCursor).width;
  const maxLeft = input.clientWidth - cursor.offsetWidth;
  const left = Math.max(0, Math.min(measuredText - input.scrollLeft, maxLeft));
  cursor.style.setProperty("--cursor-left", `${left}px`);
}

function updateCursorSoon() {
  window.requestAnimationFrame(updateCursor);
}
