# Security

Mandate 0.1 is a reference authorization kernel, not a production custody or
execution system. It has no network listener, authentication layer, durable
permit store, signer, or venue credential integration.

Do not connect it to real capital. A production deployment requires, at
minimum, authenticated state inputs, durable atomic permit consumption,
independent key custody, relay isolation, replay protection across processes,
observability, and external review.

Please report suspected vulnerabilities privately to the repository owner
instead of opening a public issue.
