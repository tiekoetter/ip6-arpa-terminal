# ip6-arpa-terminal

A tiny static easter egg for `www.0.1.5.c.4.5.9.0.a.2.ip6.arpa`.

It opens as a fake bash-like terminal with a reverse-DNS MOTD and a few predefined commands:

- `help`
- `zone`
- `whois`
- `dig`
- `tls`
- `https`
- `contact`
- `host`
- `ls`
- `cat FILE`
- `pwd`
- `whoami`
- `sudo ...`
- `motd`
- `date`
- `clear`
- `echo ...`

## Hosting

Serve the repository root from your webserver and point DNS for:

```text
www.0.1.5.c.4.5.9.0.a.2.ip6.arpa
```

at that server.

Suggested TXT record for the `www` name:

```dns
www.0.1.5.c.4.5.9.0.a.2.ip6.arpa. 3600 IN TXT "yes, this is a website in ip6.arpa"
```

This site is intentionally plain HTTP. Current mainstream public CAs do not issue ordinary browser-trusted certificates for `.arpa` names, so do not configure automatic HTTPS redirects for this vhost unless you are using a private trust setup.
