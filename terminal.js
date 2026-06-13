const zone = "0.1.5.c.4.5.9.0.a.2.ip6.arpa";
const host = `www.${zone}`;
const aRecords = ["152.53.125.158"];
const aaaaRecords = ["2a09:54c5:1010:443::1", "2a14:7c0:4bfc:443::1"];
const txtRecord = "yes, this is a website in ip6.arpa";
const nsRecords = [
  "ns1.tiekoetter.net.",
  "ns2.tiekoetter.net.",
  "ns3.tiekoetter.net.",
  "ns4.tiekoetter.net.",
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
const form = document.querySelector("#command-form");
const input = document.querySelector("#command-input");
const cursor = document.querySelector("#block-cursor");
const cursorCanvas = document.createElement("canvas");
const cursorContext = cursorCanvas.getContext("2d");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const history = [];
let historyIndex = 0;
let isBooting = false;
let skipBootRequested = false;

const bootLines = [
  `querying ${host}`,
  `A record found:    ${aRecords.join(", ")}`,
  `AAAA records found: ${aaaaRecords.join(", ")}`,
  "HTTP endpoint reachable ............ ok",
  "loading terminal interface ......... ok",
  `connected as guest@${host}`,
  "",
];

const motd = formatBox([
  { text: "RDNS TERMINAL", align: "center" },
  "",
  `Website: ${host}`,
  `Zone:    ${zone}`,
  `TXT:     "${txtRecord}"`,
]);

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
      "  tls       Explain the HTTPS situation",
      "  https     Alias for tls",
      "  host      Print the current hostname",
      "  ls        List this tiny filesystem",
      "  cat FILE  Print one of the listed files",
      "  pwd       Print working directory",
      "  whoami    Print current user",
      "  motd      Print the banner again",
      "  date      Print local browser time",
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
      `txt:  "${txtRecord}"`,
      "",
      "This name lives under ip6.arpa, the namespace used for IPv6 reverse DNS.",
      "It is also pointed at a tiny plain-HTTP website, because DNS names can have hobbies.",
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

  motd() {
    return motd;
  },

  tls() {
    return [
      "This host is intentionally available over plain HTTP.",
      "",
      "Mainstream public CAs do not currently issue ordinary browser-trusted",
      "certificates for .arpa names.",
      "",
      "If you know a CA that does, or you are such a CA, please email me.",
    ].join("\n");
  },

  https() {
    return commands.tls();
  },

  host() {
    return host;
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
        if (!fileContents[fileName]) {
          return `cat: ${fileName}: No such file`;
        }

        return fileContents[fileName]();
      })
      .join("\n\n");
  },

  pwd() {
    return `/srv/www/${host}`;
  },

  whoami() {
    return "guest";
  },

  date() {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "full",
      timeStyle: "long",
    }).format(new Date());
  },

  clear() {
    terminal.replaceChildren();
    return "";
  },
};

function formatBox(lines) {
  const normalizedLines = lines.map((line) => {
    if (typeof line === "string") {
      return { text: line, align: "left" };
    }

    return line;
  });

  const width = Math.max(...normalizedLines.map((line) => line.text.length));
  const border = `+${"-".repeat(width + 2)}+`;
  const body = normalizedLines.map(({ text, align }) => {
    if (align !== "center") {
      return `| ${text.padEnd(width, " ")} |`;
    }

    const leftPadding = Math.floor((width - text.length) / 2);
    const rightPadding = width - text.length - leftPadding;
    return `| ${" ".repeat(leftPadding)}${text}${" ".repeat(rightPadding)} |`;
  });

  return `${border}\n${body.join("\n")}\n${border}\n\nType "help" for available commands.`;
}

function appendBlock(text, className = "") {
  if (!text) return;

  const block = document.createElement("pre");
  if (className) block.className = className;
  block.textContent = text;
  terminal.append(block);
  terminal.scrollTop = terminal.scrollHeight;
}

function appendPrompt(command) {
  appendBlock(`guest@${host}:~$ ${command}`, "output-command");
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

  if (commands[command]) {
    appendBlock(commands[command](args));
    return;
  }

  appendBlock(
    `${name}: command not found\nTry "help" for the list of known commands.`,
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
  isBooting = true;
  skipBootRequested = false;
  form.classList.add("is-booting");
  input.disabled = true;

  for (const line of bootLines) {
    if (skipBootRequested) break;
    await appendBootLine(line);
  }

  if (skipBootRequested) {
    terminal.replaceChildren();
  } else {
    await sleep(180);
    if (skipBootRequested) {
      terminal.replaceChildren();
    }
  }

  appendBlock(motd, "output-success");

  isBooting = false;
  input.disabled = false;
  form.classList.remove("is-booting");
  input.focus();
  updateCursor();
}

async function appendBootLine(text) {
  if (skipBootRequested) return;

  if (prefersReducedMotion || !text) {
    appendBlock(text, "output-muted boot-line");
    await sleep(text ? 80 : 120);
    if (skipBootRequested) {
      terminal.replaceChildren();
    }
    return;
  }

  const block = document.createElement("pre");
  block.className = "output-muted boot-line";
  terminal.append(block);

  for (const character of text) {
    if (skipBootRequested) return;

    block.textContent += character;
    terminal.scrollTop = terminal.scrollHeight;
    await sleep(8);
  }

  if (skipBootRequested) return;

  await sleep(90);
  if (skipBootRequested) {
    terminal.replaceChildren();
  }
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
