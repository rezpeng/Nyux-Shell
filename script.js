const output = document.getElementById('output');
const commandInput = document.getElementById('command');

const bootMessages = [
  'booting nyuxshell..\n',
  'Initializing virtual CPU... [OK]\n',
  'Loading kernel modules... [OK]\n',
  'Mounting root filesystem... [OK]\n',
  'Starting user shell...\n',
  '\nWelcome to nyuxshell! Type `help` for commands.\n',
];

const fileSystem = {
  '/': ['bin', 'boot', 'etc', 'home', 'tmp', 'usr', 'var'],
  '/home': ['nyux'],
  '/home/nyux': ['README.txt', 'notes.txt', 'projects'],
  '/home/nyux/projects': ['linux-kernel-html'],
};

const commandHistory = [];
let currentDirectory = '/home/nyux';

const builtins = {
  help: `Common commands:
  help, version, about, clear, exit, history, man, alias, echo, uname, whoami, id,
  pwd, cd, ls, cat, grep, touch, mkdir, rmdir, rm, cp, mv, chmod, chown,
  date, hostname, env, export, unset,
  ps, top, kill, killall, df, du, free, uptime,
  ping, ifconfig, ip, route,
  tar, gzip, gunzip, zip, unzip,
  find, locate, which, whereis,
  hash, reboot, shutdown,
`,
  version: 'nyuxshell 1.0.0\n',
  about: 'nyuxshell is a browser-based shell simulator with many Linux-like commands.\n',
};

function appendText(text) {
  output.textContent += text;
  output.scrollTop = output.scrollHeight;
}

function getPrompt() {
  return ' ~ > ';
}

function normalizePath(path) {
  if (!path) return currentDirectory;
  if (path.startsWith('/')) return path.replace(/\/+$|\/$/, '') || '/';
  if (path === '~') return '/home/nyux';
  if (path.startsWith('~/')) return `/home/nyux/${path.slice(2)}`.replace(/\/+$|\/$/, '');
  if (currentDirectory === '/') return `/${path}`;
  return `${currentDirectory}/${path}`.replace(/\/+$|\/$/, '');
}

function resolveDirectory(path) {
  const normalized = normalizePath(path).replace(/\/+/g, '/');
  if (fileSystem[normalized]) return normalized;
  return null;
}

function listDirectory(path) {
  const dir = resolveDirectory(path);
  if (!dir) return null;
  return fileSystem[dir].join('  ') + '\n';
}

function runHashAlias(tokens) {
  if (tokens.length === 1) return 'hash: missing command\n';
  tokens.shift();
  return executeCommand(tokens.join(' '), true);
}

function executeCommand(command, isHash = false) {
  const tokens = command.split(/\s+/).filter(Boolean);
  if (!tokens.length) return '';

  if (tokens[0] === 'hash') return runHashAlias(tokens);
  if (tokens[0] === 'sudo') return 'hash: command not found: sudo\n';

  switch (tokens[0]) {
    case 'help':
      return builtins.help;
    case 'version':
      return builtins.version;
    case 'about':
      return builtins.about;
    case 'clear':
      output.textContent = '';
      return '';
    case 'exit':
      return 'Session ended. Refresh the page to restart.\n';
    case 'history':
      return commandHistory.map((cmd, idx) => `${idx + 1}  ${cmd}`).join('\n') + '\n';
    case 'man':
      return tokens[1]
        ? `No manual entry for ${tokens[1]}.\n`
        : 'What manual page do you want?\n';
    case 'pwd':
      return `${currentDirectory}\n`;
    case 'cd': {
      const target = tokens[1] || '/home/nyux';
      const newDir = resolveDirectory(target);
      if (!newDir) return `cd: no such file or directory: ${target}\n`;
      currentDirectory = newDir;
      return '';
    }
    case 'ls':
      return listDirectory(tokens[1] || currentDirectory) || `ls: cannot access '${tokens[1] || ''}': No such file or directory\n`;
    case 'cat':
      if (!tokens[1]) return 'cat: missing file operand\n';
      if (tokens[1] === 'README.txt') return 'nyuxshell is a lightweight browser shell demo.\n';
      if (tokens[1] === 'notes.txt') return 'TODO: add more shell features.\n';
      return `cat: ${tokens[1]}: No such file or directory\n`;
    case 'echo':
      return tokens.slice(1).join(' ') + '\n';
    case 'mkdir':
      return tokens[1] ? `mkdir: created directory '${tokens[1]}'\n` : 'mkdir: missing operand\n';
    case 'rmdir':
      return tokens[1] ? `rmdir: failed to remove '${tokens[1]}': No such file or directory\n` : 'rmdir: missing operand\n';
    case 'rm':
      return tokens[1] ? `rm: cannot remove '${tokens[1]}': Permission denied\n` : 'rm: missing operand\n';
    case 'touch':
      return tokens[1] ? `${tokens[1]}\n` : 'touch: missing file operand\n';
    case 'cp':
      return tokens.length < 3 ? 'cp: missing file operand\n' : '';
    case 'mv':
      return tokens.length < 3 ? 'mv: missing file operand\n' : '';
    case 'chmod':
      return tokens.length < 3 ? 'chmod: missing operand\n' : '';
    case 'chown':
      return tokens.length < 3 ? 'chown: missing operand\n' : '';
    case 'uname':
      return 'Nyux\n';
    case 'whoami':
      return 'nyux\n';
    case 'id':
      return 'uid=1000(nyux) gid=1000(nyux) groups=1000(nyux)\n';
    case 'date':
      return new Date().toString() + '\n';
    case 'hostname':
      return 'nyuxshell\n';
    case 'env':
      return 'SHELL=nyuxshell\nHOME=/home/nyux\nUSER=nyux\n';
    case 'ps':
      return '  PID TTY          TIME CMD\n 1234 pts/0    00:00:00 bash\n 2345 pts/0    00:00:01 nyuxshell\n';
    case 'top':
      return 'top - 1 user system info...\n';
    case 'df':
      return 'Filesystem      1K-blocks   Used Available Use% Mounted on\n/dev/root         30466524 1467188  27560068   5% /\n';
    case 'du':
      return '4\t./projects\n2\t./notes.txt\n';
    case 'free':
      return '              total        used        free      shared  buff/cache   available\nMem:        16384       5248       8320        128       3816      10520\n';
    case 'uptime':
      return ' 14:23:01 up  1:23,  1 user,  load average: 0.02, 0.05, 0.01\n';
    case 'ping':
      return tokens[1] ? `PING ${tokens[1]} (127.0.0.1): 56 data bytes\n64 bytes from 127.0.0.1: icmp_seq=0 ttl=64 time=0.058 ms\n--- ${tokens[1]} ping statistics ---\n1 packets transmitted, 1 packets received, 0.0% packet loss\n` : 'ping: usage: ping <destination>\n';
    case 'ifconfig':
      return 'eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500\ninet addr:127.0.0.1  Mask:255.0.0.0\n';
    case 'ip':
      return tokens[1] === 'addr' ? '1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536\n    inet 127.0.0.1/8 scope host lo\n' : `Usage: ip [OPTIONS] OBJECT COMMAND\n`;
    case 'route':
      return 'Kernel IP routing table\nDestination Gateway Genmask Flags Metric Ref Use Iface\n0.0.0.0 127.0.0.1 0.0.0.0 UG 0 0 0 lo\n';
    case 'tar':
      return 'tar: Old option `f\' not supported\n';
    case 'gzip':
      return 'gzip: compressed data not written to a terminal. Use -c.\n';
    case 'zip':
      return 'zip warning: name not matched: file\n';
    case 'find':
      return 'find: missing argument to `-exec`\n';
    case 'which':
      return tokens[1] ? `/usr/bin/${tokens[1]}\n` : 'which: no command specified\n';
    case 'whereis':
      return tokens[1] ? `${tokens[1]}: /usr/bin/${tokens[1]} /usr/share/man/man1/${tokens[1]}.1.gz\n` : 'whereis: no command specified\n';
    case 'apt': {
      const sub = tokens[1];
      if (!sub) return 'Usage: apt [update|upgrade|install|remove|search]\n';
      if (sub === 'update') return 'Get:1 http://archive.ubuntu.com/ubuntu focal InRelease\nFetched 2.3 MB in 1s\n';
      if (sub === 'upgrade') return 'Calculating upgrade... 0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.\n';
      if (sub === 'install') return tokens[2] ? `Reading package lists...\nBuilding dependency tree...\nThe following NEW packages will be installed: ${tokens.slice(2).join(' ')}\nAfter this operation, 1 MB of additional disk space will be used.\n` : 'Usage: apt install <package>\n';
      if (sub === 'remove') return tokens[2] ? `Removing ${tokens[2]}... Done.\n` : 'Usage: apt remove <package>\n';
      if (sub === 'search') return tokens[2] ? `Searching for ${tokens[2]}...\nNo results found.\n` : 'Usage: apt search <term>\n';
      return 'apt: unknown subcommand\n';
    }
    case 'pacman': {
      const sub = tokens[1];
      if (!sub) return 'Usage: pacman [-S|-R|-Ss|-Sy| -Syu]\n';
      if (sub === '-S') return tokens[2] ? `resolving dependencies...\nlooking for ${tokens[2]} in sync databases...\n:: Proceed with installation? [Y/n] y\ninstalled: ${tokens[2]}\n` : 'Usage: pacman -S <package>\n';
      if (sub === '-R') return tokens[2] ? `checking dependencies...\nerror: failed to remove (${tokens[2]}): package not found\n` : 'Usage: pacman -R <package>\n';
      if (sub === '-Ss') return tokens[2] ? `searching for ${tokens[2]}...\nlocal/${tokens[2]} 1.0-1\n` : 'Usage: pacman -Ss <term>\n';
      if (sub === '-Syu' || (sub === '-Sy' && tokens[2] === 'u')) return ':: Synchronizing package databases...\n:: Starting full system upgrade...\n0 packages to upgrade.\n';
      return 'pacman: unknown options\n';
    }
    case 'rpm': {
      const sub = tokens[1];
      if (!sub) return 'Usage: rpm [-qa|-qi|-ivh|-e]\n';
      if (sub === '-qa') return 'bash-5.1.8-1\ncoreutils-8.32-4\nnyuxshell-1.0.0-1\n';
      if (sub === '-q' && tokens[2]) return `${tokens[2]}-1.0.0-1\n`;
      if (sub === '-i' || sub === '-ivh') return tokens[2] ? `Preparing...\nInstalling (${tokens[2]})\n` : 'Usage: rpm -i <package.rpm>\n';
      if (sub === '-e') return tokens[2] ? `Removing ${tokens[2]}...\n` : 'Usage: rpm -e <package>\n';
      return 'rpm: unknown options\n';
    }
    case 'reboot':
      return 'Rebooting system...\n';
    case 'shutdown':
      return 'System is going down for shutdown now.\n';
    default:
      return `Command not found: ${tokens[0]}\n`;
  }
}

function bootSequence() {
  let idx = 0;
  function next() {
    if (idx >= bootMessages.length) {
      appendText(getPrompt());
      commandInput.focus();
      return;
    }
    appendText(bootMessages[idx]);
    idx += 1;
    setTimeout(next, 450);
  }
  next();
}

commandInput.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return;
  const command = commandInput.value.trim();
  appendText(command + '\n');
  commandInput.value = '';

  if (command) {
    commandHistory.push(command);
  }

  const outputText = executeCommand(command);
  if (outputText) appendText(outputText);
  appendText(getPrompt());
});

bootSequence();
