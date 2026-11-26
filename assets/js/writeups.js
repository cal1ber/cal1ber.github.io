
window.WRITEUPS = [
  {
    name: "Nibbles", platform: "HTB", os: "Linux", level: "easy", state: "ROOT", date: "2026-11",
    tracks: ["linux", "web", "htb"],
    tech: "A hidden blog with a guessable admin password and an outdated upload plugin, rooted through a loose sudo rule.",
    summary: "An unauthenticated attacker can take full control of this web server. A hidden blog is exposed through the page source, its admin panel accepts a guessable password, an outdated plugin lets an admin upload and run code, and a loose sudo rule turns the web user into root.",
    findings: [
      { sev: "critical", title: "Arbitrary file upload in outdated Nibbleblog (CVE-2015-6967)",
        impact: "Any admin can upload a script and run commands on the server.",
        fix: "Update or remove the blog and its image plugin, store uploads outside the web root and block script execution in upload folders." },
      { sev: "high", title: "Writable script allowed in sudo",
        impact: "The web user can edit a script it may run as root, so any foothold becomes full root.",
        fix: "Remove the sudo rule or make the script root-owned and read-only. Grant only the exact commands needed." },
      { sev: "high", title: "Weak, guessable admin password",
        impact: "The admin panel falls to a single educated guess, with no second factor.",
        fix: "Enforce strong unique passwords, add MFA and keep admin panels off the public internet." },
      { sev: "low", title: "Information disclosure (hidden path, version, username)",
        impact: "Page source, README and readable data files hand out the app path, its exact version and the admin username.",
        fix: "Strip comments from production pages and deny public access to README and data folders." }
    ],
    chain: ["Page source reveals hidden blog", "Version + admin user leak", "Admin login, guessed password", "Plugin upload → shell", "sudo -l → writable script → root"],
    lesson: "The boring files did half the work: read the source, the README and the readable data folders before anything fancy, and run sudo -l first thing on every shell.",
    tags: ["nibbleblog", "CVE-2015-6967", "file upload", "sudo"]
  },
  {
    name: "Retro", platform: "THM", os: "Windows", level: "hard", state: "ROOT", date: "2026-11",
    tracks: ["windows", "web"],
    tech: "A Windows server whose own blog gives away the RDP login; an unpatched UAC bug hands over SYSTEM.",
    summary: "A Windows Server 2016 host gives up a valid user through its own blog: the author posts enough to guess the login. RDP accepts it, and an unpatched UAC certificate-dialog flaw turns that user into SYSTEM.",
    findings: [
      { sev: "critical", title: "Unpatched UAC certificate dialog (CVE-2019-1388)",
        impact: "Any interactive user can open a SYSTEM process from the certificate viewer and take over the host.",
        fix: "Apply the November 2019 security update and remove leftover installers that can trigger elevation." },
      { sev: "high", title: "Credentials disclosed in public blog content",
        impact: "A post and its comments reveal enough to log in as the site's author.",
        fix: "Review published content for secrets, rotate exposed credentials and train staff on what not to post." },
      { sev: "medium", title: "RDP exposed with password-only login",
        impact: "One leaked password means a full desktop session on the server.",
        fix: "Put RDP behind a VPN or gateway, require NLA and MFA, and lock out repeated failures." }
    ],
    chain: ["nmap -Pn (no ICMP)", "Hidden WordPress blog", "Creds pieced together from posts", "RDP as the blog author", "CVE-2019-1388 → SYSTEM"],
    lesson: "When the box hands you a clue (an installer in the Recycle Bin, a CVE bookmark), follow it before spending hours on generic Potato attacks.",
    tags: ["wordpress", "rdp", "CVE-2019-1388", "uac", "seimpersonate"]
  },
  {
    name: "Mr Robot", platform: "THM", os: "Linux", level: "medium", state: "ROOT", date: "2026-11",
    tracks: ["linux", "web"],
    tech: "A WordPress site that leaks its own password list, rooted through an old SUID nmap.",
    summary: "A WordPress site leaks a wordlist through robots.txt, its login reveals valid usernames, and the admin password is in that wordlist. From admin, the theme editor gives code execution, a world-readable hash gives a second user, and an old SUID nmap gives root.",
    findings: [
      { sev: "critical", title: "SUID root on an old nmap with interactive mode",
        impact: "Any local user can escape to a root shell.",
        fix: "Remove the SUID bit, update nmap and audit SUID binaries against GTFOBins." },
      { sev: "high", title: "Brute-forceable WordPress login with username enumeration",
        impact: "Different error messages confirm usernames, and no lockout lets the password be guessed.",
        fix: "Use a generic login error, add rate limiting or lockout and require MFA for admins." },
      { sev: "high", title: "Theme editor enabled for admins",
        impact: "Admin access becomes code execution on the server.",
        fix: "Set DISALLOW_FILE_EDIT and keep theme files read-only for the web user." },
      { sev: "medium", title: "World-readable password hash (unsalted MD5)",
        impact: "Any user can read and instantly crack another user's password.",
        fix: "Never store hashes in home folders, use a slow salted hash and fix file permissions." }
    ],
    chain: ["robots.txt → wordlist", "Username enumeration", "Password brute force", "Theme editor → shell", "Crack hash → second user", "SUID nmap → root"],
    lesson: "A rushed aggressive scan can mark open ports as closed. Over a VPN, slow down and confirm with a service scan before moving on.",
    tags: ["wordpress", "hydra", "hashcat", "suid", "gtfobins"]
  },
  {
    name: "Corp", platform: "THM", os: "AD", level: "easy", state: "ROOT", date: "2026-11",
    tracks: ["ad", "windows"],
    tech: "A locked-down domain workstation: AppLocker bypass, Kerberoasting and a forgotten install file lead to Administrator.",
    summary: "Starting as a low-privilege domain user on a locked-down Windows host, AppLocker is bypassed through a writable whitelisted folder. A service account's Kerberos ticket is cracked offline, and an unattended-install file left on disk hands over the local Administrator password.",
    findings: [
      { sev: "critical", title: "Administrator password left in unattended install file",
        impact: "Any user who can read the file becomes local admin.",
        fix: "Delete unattend files after deployment, rotate the exposed password and use LAPS for local admin." },
      { sev: "high", title: "Kerberoastable service account with a weak password",
        impact: "Any domain user can request its ticket and crack it offline.",
        fix: "Use gMSAs or 25+ character passwords for service accounts, enforce AES, and alert on RC4 ticket requests." },
      { sev: "medium", title: "AppLocker default rules allow user-writable paths",
        impact: "Users can run any binary from writable folders inside C:\\Windows.",
        fix: "Tighten rules to exclude writable subfolders and move to publisher-based allow-listing." },
      { sev: "low", title: "Secrets in PowerShell history",
        impact: "Past commands with sensitive data are readable by the user and anyone who compromises them.",
        fix: "Don't type secrets on the command line, clear history and monitor it with EDR." }
    ],
    chain: ["Domain user, AppLocker on", "Run from whitelisted writable path", "PSReadline history looting", "Kerberoast → crack offline", "PowerUp → unattend file", "Administrator"],
    lesson: "Low-privilege AD footholds are rarely dead ends: enumerate SPNs and leftover deployment files before reaching for exploits.",
    tags: ["applocker", "kerberoasting", "powerup", "unattend.xml", "hashcat"]
  },
  {
    name: "Brainpan 1", platform: "THM", os: "Linux", level: "hard", state: "ROOT", date: "2026-09",
    tracks: ["linux", "bof"],
    tech: "A custom network service with a textbook stack overflow, found sitting on the box's own web server.",
    summary: "A custom network service is downloadable from the box's own web server. Debugging it locally shows a classic stack overflow with no protections, which gives a remote shell, and a permissive sudo rule finishes the job.",
    findings: [
      { sev: "critical", title: "Stack buffer overflow in custom network service",
        impact: "Unauthenticated remote code execution on the host.",
        fix: "Fix unsafe string copies, compile with stack canaries, DEP and ASLR, and stop shipping debug builds." },
      { sev: "high", title: "Sudo rule allows a utility with a shell escape",
        impact: "The service user can become root.",
        fix: "Remove the rule or restrict it to non-interactive commands." },
      { sev: "medium", title: "Service binary downloadable from the web root",
        impact: "Attackers can build and test an exploit offline before touching the target.",
        fix: "Keep binaries and backups out of public web folders." }
    ],
    chain: ["Web dir enum finds the binary", "Fuzz → crash", "Offset + JMP ESP + bad chars", "Reverse shell", "sudo → root"],
    lesson: "Overflow work is a checklist: fuzz, find the offset, control EIP, kill bad chars, find a JMP ESP, then shellcode. Rushing a step costs more time than it saves.",
    tags: ["buffer overflow", "immunity", "mona", "wine", "sudo"]
  },
  {
    pinned: true,
    name: "Gatekeeper", platform: "THM", os: "Windows", level: "medium", state: "ROOT", date: "2026-09",
    tracks: ["windows", "bof"],
    tech: "A buffer overflow in a custom Windows service; saved Firefox passwords give up the admin account.",
    summary: "An anonymous SMB share contains the binary of a service running on the box. A stack overflow in it gives a user shell, and the user's Firefox profile stores admin credentials that decrypt offline.",
    findings: [
      { sev: "critical", title: "Stack buffer overflow in exposed service",
        impact: "Unauthenticated remote code execution.",
        fix: "Patch the code, enable DEP/ASLR and restrict the service to trusted networks." },
      { sev: "high", title: "Admin credentials saved in browser without a primary password",
        impact: "Anyone with the user's files can decrypt the stored logins.",
        fix: "Use a password manager, set a browser primary password and never save admin creds on user machines." },
      { sev: "medium", title: "Anonymous SMB share with sensitive files",
        impact: "The service binary is handed to attackers to study offline.",
        fix: "Disable guest access and audit share contents." }
    ],
    chain: ["Anonymous SMB → binary", "Local debug: offset, bad chars, JMP ESP", "Shell as user", "Loot Firefox profile", "Decrypt creds → admin"],
    lesson: "After the exploit, loot before you escalate: browser profiles and credential stores often beat any privesc exploit.",
    tags: ["buffer overflow", "smb", "firefox decrypt", "mona"]
  },
  {
    name: "Brainstorm", platform: "THM", os: "Windows", level: "medium", state: "ROOT", date: "2026-09",
    tracks: ["windows", "bof"],
    tech: "A chat server shared over anonymous FTP, exploited with a buffer overflow that lands straight as SYSTEM.",
    summary: "Anonymous FTP exposes a custom chat server and its DLL. Reproducing it in a Windows debugger reveals an overflow in the message field, and because the service runs as SYSTEM the exploit lands straight on top.",
    findings: [
      { sev: "critical", title: "Buffer overflow in chat service running as SYSTEM",
        impact: "One crafted message gives full control of the host.",
        fix: "Fix the input handling, enable exploit mitigations and run the service as a low-privilege account." },
      { sev: "medium", title: "Anonymous FTP exposing application files",
        impact: "Attackers get the exact binaries to build an exploit.",
        fix: "Disable anonymous FTP or limit it to public, non-sensitive files." }
    ],
    chain: ["Anonymous FTP (passive off)", "Grab chatserver + DLL", "Fuzz message field", "Offset, bad chars, JMP ESP", "Shell as SYSTEM"],
    lesson: "Least privilege matters even for small services: the same bug as a low-priv user would have been a much smaller incident.",
    tags: ["buffer overflow", "ftp", "immunity", "mona", "msfvenom"]
  },
  {
    pinned: true,
    name: "Internal", platform: "THM", os: "Linux", level: "hard", state: "ROOT", date: "2026-07",
    tracks: ["linux", "web"],
    tech: "A black-box test of one host: weak WordPress login, leaked credentials and a Jenkins hidden on localhost.",
    summary: "A black-box engagement on a single host. A weak WordPress admin password leads to code execution, credentials left on disk give SSH, and an internal Jenkins only reachable through a tunnel falls to brute force and hands over root.",
    findings: [
      { sev: "critical", title: "Internal Jenkins with weak admin password",
        impact: "Script console access gives code execution and leads to root credentials.",
        fix: "Enforce strong passwords and SSO on Jenkins, lock down the script console and segment internal tools." },
      { sev: "high", title: "Weak WordPress admin password",
        impact: "Brute force gives admin and then code execution via the theme editor.",
        fix: "Strong passwords, MFA, login rate limiting and DISALLOW_FILE_EDIT." },
      { sev: "high", title: "Plaintext credentials stored on the server",
        impact: "A web foothold turns into an SSH user.",
        fix: "Remove credential files, use a secrets manager and rotate what was exposed." },
      { sev: "low", title: "phpMyAdmin exposed to the network",
        impact: "Extra login surface for credential reuse.",
        fix: "Restrict admin panels to localhost or VPN." }
    ],
    chain: ["Recon: WordPress + phpMyAdmin", "wpscan + brute force admin", "Theme editor → shell", "Creds on disk → SSH", "ss -tulpn → hidden Jenkins", "SSH tunnel + Hydra → Jenkins → root"],
    lesson: "Always check what's listening on localhost after a foothold. The most valuable service on the box was the one you couldn't see from outside.",
    tags: ["wordpress", "wpscan", "ssh tunnel", "jenkins", "hydra"]
  },
  {
    name: "Relevant", platform: "THM", os: "Windows", level: "medium", state: "ROOT", date: "2026-07",
    tracks: ["windows", "web"],
    tech: "A guest-writable SMB share that IIS also serves, turned into a web shell and then SYSTEM.",
    summary: "A black-box test with a twist: an SMB share writable by guests is also served by IIS on a high port. Dropping a web shell there gives code execution as the IIS account, and its impersonation privilege leads to SYSTEM.",
    findings: [
      { sev: "critical", title: "Guest-writable SMB share mapped into IIS",
        impact: "Anyone can upload a web shell and run code on the server.",
        fix: "Remove guest write access and never map file shares into web roots." },
      { sev: "high", title: "Service account with SeImpersonatePrivilege",
        impact: "Code execution as the web account becomes SYSTEM.",
        fix: "Patch, run app pools with least privilege and monitor for Potato/PrintSpoofer tooling." },
      { sev: "medium", title: "Encoded credentials in a share file",
        impact: "Base64 is not encryption: the accounts can be read by anyone.",
        fix: "Remove the file and rotate the accounts." }
    ],
    chain: ["SMB enum: guest share", "Same share on IIS high port", "Upload ASPX shell", "whoami /priv → SeImpersonate", "PrintSpoofer → SYSTEM"],
    lesson: "Check where else a writable location is exposed. A share is harmless until something executes what's in it.",
    tags: ["smb", "iis", "aspx", "printspoofer", "seimpersonate"]
  },
  {
    name: "Overpass 2 - Hacked", platform: "THM", os: "Linux", level: "easy", state: "ROOT", date: "2025-12",
    tracks: ["linux"],
    tech: "Incident response in reverse: rebuild an attack from a packet capture and reuse the attacker's backdoor.",
    summary: "An incident-response exercise from the other side. A packet capture shows how the server was breached and the SSH backdoor the attacker installed. Cracking the backdoor's hardcoded hash lets you walk back in and find the attacker's own privesc.",
    findings: [
      { sev: "critical", title: "Persistent SSH backdoor left by attacker",
        impact: "Anyone with the backdoor password has a shell on the server.",
        fix: "Rebuild the host from a clean image, rotate all credentials and hunt for persistence." },
      { sev: "high", title: "SUID shell copy planted for privilege escalation",
        impact: "Any local user can become root.",
        fix: "Audit SUID files against a known-good baseline and alert on new ones." },
      { sev: "high", title: "Web upload abused for initial access",
        impact: "The original breach came through an unrestricted upload.",
        fix: "Validate uploads server-side and block execution in upload folders." }
    ],
    chain: ["Wireshark: follow the attack", "Extract backdoor + hash", "Crack with the salt", "SSH in via the backdoor", "Attacker's SUID binary → root"],
    lesson: "Reading an attacker's footprints in a PCAP is the same skill as writing a good report: what happened, in what order, and what to close.",
    tags: ["forensics", "wireshark", "pcap", "backdoor", "suid"]
  },
  {
    name: "Daily Bugle", platform: "THM", os: "Linux", level: "hard", state: "ROOT", date: "2025-11",
    tracks: ["linux", "web"],
    tech: "An outdated Joomla site with SQL injection, a reused password and a sudo rule on yum.",
    summary: "An outdated Joomla site is vulnerable to SQL injection that dumps the admin hash. Once cracked, the template editor gives code execution, a reused password gives a real user, and a sudo rule on yum gives root.",
    findings: [
      { sev: "critical", title: "SQL injection in Joomla 3.7.0 (CVE-2017-8917)",
        impact: "Unauthenticated users can dump the user table.",
        fix: "Update Joomla and put a WAF in front of public CMSs." },
      { sev: "high", title: "Sudo allows yum with plugins",
        impact: "A user can load a plugin and get a root shell.",
        fix: "Remove the rule or wrap package installs in a controlled script." },
      { sev: "high", title: "Password reuse between web config and system user",
        impact: "One leaked config gives SSH access.",
        fix: "Unique passwords per service and a secrets manager for app configs." },
      { sev: "medium", title: "Template editing enabled for admins",
        impact: "CMS admin becomes code execution.",
        fix: "Restrict template edits and keep the web root read-only." }
    ],
    chain: ["Joomscan → version", "CVE-2017-8917 SQLi", "Crack bcrypt hash", "Template edit → shell", "Config password reuse → user", "sudo yum → root"],
    lesson: "Version fingerprinting first: once you know it's 3.7.0, the whole box is a known path.",
    tags: ["joomla", "sqli", "CVE-2017-8917", "john", "gtfobins"]
  },
  {
    name: "Skynet", platform: "THM", os: "Linux", level: "easy", state: "ROOT", date: "2025-11",
    tracks: ["linux", "web"],
    tech: "Leaked passwords open a webmail inbox that leads to a hidden, vulnerable CMS and a root cron job.",
    summary: "An anonymous SMB share leaks a password list that opens a user's webmail. The mail resets a share password, which reveals a hidden CMS with a remote file inclusion bug, and a root cron job running tar with a wildcard finishes the chain.",
    findings: [
      { sev: "critical", title: "Remote file inclusion in Cuppa CMS",
        impact: "Unauthenticated remote code execution.",
        fix: "Remove or update the CMS and disable allow_url_include." },
      { sev: "high", title: "Root cron job runs tar with a wildcard",
        impact: "Crafted filenames inject options and run commands as root.",
        fix: "Never use wildcards in privileged scripts; pass explicit paths." },
      { sev: "high", title: "Anonymous SMB share with password lists",
        impact: "Leaked wordlist leads directly to a valid mail login.",
        fix: "Disable anonymous access and remove sensitive logs from shares." }
    ],
    chain: ["SMB anonymous → logs", "Brute webmail with leaked list", "Mail → share password", "Hidden CMS → RFI shell", "Cron tar wildcard → root"],
    lesson: "Read every file you're allowed to read. The whole chain started from a log file in a guest share.",
    tags: ["smb", "squirrelmail", "rfi", "cron", "tar wildcard"]
  },
  {
    name: "Game Zone", platform: "THM", os: "Linux", level: "easy", state: "ROOT", date: "2025-11",
    tracks: ["linux", "web"],
    tech: "SQL injection all the way to SSH, then a Webmin panel hidden on localhost, reached through a tunnel.",
    summary: "The login form is injectable, and sqlmap on the search feature dumps a crackable hash that works for SSH. A web admin panel only listening on localhost is exposed through an SSH tunnel and falls to a known Webmin exploit.",
    findings: [
      { sev: "critical", title: "Outdated Webmin with authenticated RCE (CVE-2012-2982)",
        impact: "Root code execution on the host.",
        fix: "Update Webmin and keep admin panels behind a VPN." },
      { sev: "critical", title: "SQL injection in login and search",
        impact: "Login bypass and full database dump.",
        fix: "Parameterised queries everywhere." },
      { sev: "high", title: "Weak, unsalted password hash reused for SSH",
        impact: "Cracked web password works on the server.",
        fix: "Slow salted hashing and no reuse between app and system accounts." }
    ],
    chain: ["SQLi login bypass", "Burp request → sqlmap dump", "John cracks hash", "SSH as user", "ss -tulpn → local Webmin", "SSH -L tunnel → Webmin RCE → root"],
    lesson: "Services bound to localhost aren't safe, they're just one tunnel away.",
    tags: ["sqli", "sqlmap", "john", "ssh tunnel", "webmin"]
  },
  {
    name: "HackPark", platform: "THM", os: "Windows", level: "medium", state: "ROOT", date: "2025-11",
    tracks: ["windows", "web"],
    tech: "A brute-forced BlogEngine admin login, a known path traversal exploit and a hijacked scheduled task.",
    summary: "A BlogEngine.NET site's admin login is brute-forced with Hydra. The installed version has a path traversal that gives code execution as the app pool, and a scheduled service binary in a writable folder gives Administrator.",
    findings: [
      { sev: "critical", title: "BlogEngine.NET 3.3.6 path traversal to RCE (CVE-2019-6714)",
        impact: "Admin access becomes code execution on the web server.",
        fix: "Update BlogEngine and restrict theme parameters." },
      { sev: "high", title: "Writable binary run by a privileged scheduler",
        impact: "Replacing the binary runs attacker code as Administrator.",
        fix: "Fix folder ACLs so only admins can write service binaries." },
      { sev: "high", title: "Brute-forceable admin login",
        impact: "No lockout; a common password falls quickly.",
        fix: "Lockout, rate limiting and strong admin passwords." }
    ],
    chain: ["nmap -Pn", "Hydra http-post-form", "CVE-2019-6714 → shell", "msfvenom → Meterpreter", "Writable scheduled binary → admin"],
    lesson: "Hydra's http-post-form syntax is picky. Copy the real request from Burp and match the failure string exactly.",
    tags: ["hydra", "blogengine", "CVE-2019-6714", "metasploit", "winpeas"]
  },
  {
    name: "Alfred", platform: "THM", os: "Windows", level: "easy", state: "ROOT", date: "2025-11",
    tracks: ["windows", "web"],
    tech: "A Jenkins server still on default credentials, and a service account that can impersonate SYSTEM.",
    summary: "A Jenkins server still uses default credentials, so a build step runs a PowerShell reverse shell. The service account holds impersonation privileges, and migrating into a SYSTEM process gives full control.",
    findings: [
      { sev: "critical", title: "Jenkins with default admin credentials",
        impact: "Anyone can run commands through build jobs.",
        fix: "Change default creds, add SSO and restrict who can configure jobs." },
      { sev: "high", title: "Service account with impersonation privileges",
        impact: "Foothold escalates to SYSTEM via token abuse.",
        fix: "Run Jenkins as a least-privilege account without SeImpersonate/SeDebug." }
    ],
    chain: ["nmap → Jenkins on 8080", "Default creds", "Build step → Nishang shell", "Meterpreter", "Token impersonation → SYSTEM"],
    lesson: "Default credentials are the first thing to try on any admin panel.",
    tags: ["jenkins", "default creds", "nishang", "incognito", "metasploit"]
  },
  {
    name: "Steel Mountain", platform: "THM", os: "Windows", level: "easy", state: "ROOT", date: "2025-09",
    tracks: ["windows", "web"],
    tech: "An old HTTP file server with remote code execution, and a Windows service anyone can replace.",
    summary: "An old Rejetto HTTP File Server gives unauthenticated code execution. PowerUp then finds a service whose folder the user can write to and restart, so swapping in a payload gives SYSTEM.",
    findings: [
      { sev: "critical", title: "Rejetto HFS 2.3 remote code execution (CVE-2014-6287)",
        impact: "Unauthenticated remote code execution.",
        fix: "Remove HFS or update it; don't expose file servers directly." },
      { sev: "high", title: "Service binary in a user-writable folder, restartable by users",
        impact: "Any user can replace it and become SYSTEM.",
        fix: "Fix folder ACLs, quote service paths and limit service control rights." }
    ],
    chain: ["nmap -sV", "HFS version → CVE-2014-6287", "Metasploit shell", "PowerUp Invoke-AllChecks", "Replace service binary → SYSTEM"],
    lesson: "Run PowerUp or winPEAS on every Windows foothold; misconfigured services are one of the most common real-world findings.",
    tags: ["rejetto", "CVE-2014-6287", "powerup", "msfvenom", "services"]
  },
  {
    name: "Kenobi", platform: "THM", os: "Linux", level: "easy", state: "ROOT", date: "2025-08",
    tracks: ["linux"],
    tech: "An FTP bug that copies an SSH key into an open NFS share, then a SUID binary with a PATH hijack.",
    summary: "Samba and NFS shares reveal the layout of the box. ProFTPD's mod_copy lets an unauthenticated user copy a private SSH key into the NFS share, and a SUID binary that calls commands without full paths gives root.",
    findings: [
      { sev: "critical", title: "ProFTPD mod_copy unauthenticated file copy",
        impact: "Attackers can copy any readable file, including private keys.",
        fix: "Update ProFTPD and disable mod_copy." },
      { sev: "high", title: "SUID binary calls commands without absolute paths",
        impact: "PATH manipulation runs attacker code as root.",
        fix: "Use absolute paths in privileged programs and remove unneeded SUID bits." },
      { sev: "medium", title: "World-mountable NFS export",
        impact: "Anyone can read files placed in the export.",
        fix: "Restrict exports to specific hosts and use root_squash." }
    ],
    chain: ["SMB + NFS enumeration", "ProFTPD mod_copy → copy key", "Mount NFS, grab key", "SSH as user", "SUID PATH hijack → root"],
    lesson: "Chaining small issues is the job: none of the three findings alone gives root.",
    tags: ["smb", "nfs", "proftpd", "suid", "path hijack"]
  },
  {
    name: "Vulnversity", platform: "THM", os: "Linux", level: "easy", state: "ROOT", date: "2025-08",
    tracks: ["linux", "web"],
    tech: "My first box: an upload filter bypass for a PHP shell, then root through SUID systemctl.",
    summary: "My first box. Directory brute force finds an internal upload page, Burp Intruder finds an allowed PHP extension, and a reverse shell lands. A SUID systemctl lets a custom service run as root.",
    findings: [
      { sev: "critical", title: "Upload filter bypass via alternate PHP extension",
        impact: "Remote code execution as the web user.",
        fix: "Allow-list extensions and content types, and block execution in upload folders." },
      { sev: "high", title: "SUID bit on systemctl",
        impact: "Any user can create and start a service as root.",
        fix: "Remove the SUID bit from systemctl." }
    ],
    chain: ["nmap -sV", "Gobuster → upload page", "Burp Intruder: extension fuzzing", "PHP reverse shell", "SUID systemctl → root"],
    lesson: "Blacklist-based upload filters always miss something. Fuzz extensions instead of guessing.",
    tags: ["gobuster", "burp intruder", "file upload", "suid", "systemctl"]
  },
  {
    pinned: true,
    name: "AoC 2025 Side Quests", platform: "THM", os: "Mixed", level: "insane", state: "DONE", date: "2025-12",
    tracks: ["web", "linux", "windows", "ad"],
    tech: "Five advanced hidden challenges from Advent of Cyber 2025, solved by about 0.1% of players.",
    summary: "The hidden Side Quests of Advent of Cyber 2025, unlocked by keys hidden in the daily tasks and solved by about 0.1% of players. Five very different challenges, each a small engagement on its own.",
    findings: [
      { sev: "critical", title: "SQ0 · Multi-host network compromise",
        impact: "Web foothold → cron privesc → credential harvesting across hosts (NetExec, Mimikatz vault) → servers.",
        fix: "Segment internal hosts, remove stored credentials and monitor credential dumping." },
      { sev: "critical", title: "SQ2 · Heap exploitation + container escape",
        impact: "House of Apple FSOP heap exploit for root in a container, then escape to the host.",
        fix: "Harden the binary, never run containers privileged and drop capabilities." },
      { sev: "high", title: "SQ3 · Prompt injection → SSRF → DNS takeover",
        impact: "An AI URL analyzer is tricked into internal requests, leading to the DNS manager.",
        fix: "Treat LLM tools as untrusted input, block internal ranges and isolate admin APIs." },
      { sev: "high", title: "SQ4 · Banking API auth flaws",
        impact: "Source code exposure and an OTP flow that lets others receive your code.",
        fix: "Bind OTPs to the account owner and never ship secrets in client code." },
      { sev: "medium", title: "SQ1 · Web console escape",
        impact: "Keypads and CGI checks bypassed step by step to escape the facility.",
        fix: "Validate on the server and protect state-changing forms." }
    ],
    chain: ["SQ0 network pivot", "SQ1 web escape", "SQ2 heap + container escape", "SQ3 AI → SSRF → DNS", "SQ4 banking API"],
    lesson: "Real variety under time pressure: AD, binary exploitation, AI, mobile and web in one month. The common thread was patient enumeration.",
    tags: ["advent of cyber", "side quest", "heap", "prompt injection", "ssrf", "mimikatz"]
  }
];
