# ip6-arpa-terminal

A tiny static Easter egg at `www.0.1.5.c.4.5.9.0.a.2.ip6.arpa`.

The page presents a simulated Bash terminal with a reverse DNS MOTD and the
following predefined commands:

- `help`
- `zone`
- `whois`
- `dig`
- `decode [NAME]`
- `arpa ADDR`
- `tls`
- `https`
- `contact`
- `fetch`
- `host`
- `ls`
- `cat FILE`
- `pwd`
- `whoami`
- `sudo ...`
- `motd`
- `date`
- `uptime`
- `history`
- `reboot`
- `clear`
- `echo ...`

The `arpa` and `decode` commands support IPv6 (`ip6.arpa`) and IPv4
(`in-addr.arpa`) reverse DNS names.

## Hosting

Serve the repository root with a web server, then create DNS records that point
the following name to it:

```text
www.0.1.5.c.4.5.9.0.a.2.ip6.arpa
```

Suggested TXT record for the `www` name:

```dns
www.0.1.5.c.4.5.9.0.a.2.ip6.arpa. 3600 IN TXT "yes, this is a website in ip6.arpa"
```

This site deliberately uses plain HTTP. Public CAs do not currently issue
certificates for `.arpa` names that mainstream browsers trust. Unless you use a
private trust setup, disable automatic HTTPS redirects for this virtual host.
