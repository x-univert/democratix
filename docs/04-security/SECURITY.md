# Security Policy

## 🔒 Security Status

**Current Status**: Proof of Concept (POC) - NOT FOR PRODUCTION

This project is currently in POC phase and has **NOT** been audited for production use.

### Known Limitations

- ⚠️ **Mock zk-SNARK implementation** - Cryptographic verification is simulated
- ⚠️ **No security audit** - Smart contracts have not been professionally audited
- ⚠️ **Development phase** - Use on devnet only

## 🚨 Supported Versions

| Version | Supported          | Status |
| ------- | ------------------ | ------ |
| 0.1.x   | :warning: POC only | Devnet |
| < 0.1   | :x: No             | -      |

**Production versions** will be marked with v1.0.0+ after security audit.

## 🛡️ Reporting a Vulnerability

We take security seriously. If you discover a vulnerability, please follow responsible disclosure:

### How to Report

1. **DO NOT** open a public GitHub issue
2. **Email** security report to: `security@democratix.vote`
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 1 week
- **Fix Timeline**: Depends on severity
  - Critical: 1-7 days
  - High: 1-2 weeks
  - Medium: 2-4 weeks
  - Low: Next release

### Bounty Program

Currently, we do not have a bug bounty program. This will be established when the project reaches production status (v1.0.0+).

However, we greatly appreciate security researchers and will:
- Credit you in our security acknowledgments
- Mention you in release notes (with permission)
- Provide early access to security patches

## 🔐 Security Best Practices

If you're using this code:

### DO NOT
- ❌ Use in production without audit
- ❌ Deploy for real elections
- ❌ Trust the mock cryptographic implementations
- ❌ Store real voter data
- ❌ Use with mainnet tokens

### DO
- ✅ Use on devnet only
- ✅ Test in controlled environments
- ✅ Report any issues you find
- ✅ Review the code before use
- ✅ Wait for v1.0.0 for production use

## 🎯 Security Roadmap

### Before Production (v1.0.0)

- [ ] Replace mock zk-SNARK with real implementation (Groth16/Plonk)
- [ ] Professional smart contract audit
- [ ] Penetration testing
- [ ] Formal verification of critical functions
- [ ] ANSSI certification (for France)
- [ ] Bug bounty program launch

### Ongoing

- [ ] Regular dependency updates
- [ ] Security patches
- [ ] Code reviews
- [ ] Vulnerability scanning

## 🔍 Security Features

### Current (POC)

- ✅ Input validation (Zod schemas)
- ✅ Structured logging (Winston)
- ✅ No secrets in code
- ✅ Environment variables for configuration

### Planned (Production)

- ⏳ Real zk-SNARK verification
- ⏳ Homomorphic encryption for votes
- ⏳ Multi-signature for critical operations
- ⏳ Rate limiting
- ⏳ DDoS protection
- ⏳ JWT authentication
- ⏳ HTTPS enforcement
- ⏳ Security headers (Helmet.js)

## 📜 Disclosure Policy

### Timeline

We follow a 90-day disclosure timeline:

1. **Day 0**: Vulnerability reported
2. **Day 7**: Initial assessment
3. **Day 30**: Fix implemented (if critical)
4. **Day 90**: Public disclosure (coordinated with reporter)

### Exceptions

- **Critical vulnerabilities**: Expedited fix and disclosure
- **Already public**: Immediate fix
- **Requires major refactoring**: Extended timeline with updates

## 🏆 Security Acknowledgments

We will maintain a list of security researchers who have helped improve DEMOCRATIX:

- *None yet - be the first!*

## 📞 Contact

- **Security Email**: security@democratix.vote
- **GitHub**: Private security advisories
- **PGP Key**: [To be published]

## ⚖️ Legal

### Responsible Disclosure Agreement

By reporting a vulnerability, you agree to:
- Give us reasonable time to fix before public disclosure
- Not exploit the vulnerability
- Not access or modify user data
- Act in good faith

We agree to:
- Acknowledge your report promptly
- Keep you updated on progress
- Credit you appropriately (with permission)
- Not pursue legal action for good faith research

## 🔗 Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Smart Contract Best Practices](https://consensys.github.io/smart-contract-best-practices/)
- [MultiversX Security Guidelines](https://docs.multiversx.com/developers/best-practices/security-guidelines/)

---

**Last Updated**: October 20, 2025

**DEMOCRATIX** - *Technology serving democracy, securely*
