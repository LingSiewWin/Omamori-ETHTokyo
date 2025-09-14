pragma circom 2.0.0;

// Simple OMAMORI ZK Circuit for JSC Privacy Layer Demo
// Proves knowledge of deposit amount within range without revealing exact value

template SimpleOmamoriProof() {
    // Private inputs (hidden from verifier)
    signal private input amount;        // Actual deposit amount
    signal private input salt;          // Random salt

    // Public inputs (visible to verifier)
    signal input minAmount;             // Minimum valid amount
    signal input maxAmount;             // Maximum valid amount
    signal input expectedHash;          // Expected commitment hash

    // Public outputs
    signal output isValid;              // 1 if valid, 0 if not
    signal output commitmentHash;       // Hash of commitment

    // Intermediate signals
    signal amountMinusSalt;
    signal hashInput;

    // Simple hash: (amount + salt)^2 + amount
    amountMinusSalt <== amount + salt;
    hashInput <== amountMinusSalt * amountMinusSalt;
    commitmentHash <== hashInput + amount;

    // Verify commitment matches expected
    expectedHash === commitmentHash;

    // Range check: amount must be between min and max
    // For demo: we'll use simple constraints
    component geq = GreaterEqualThan(32);
    component leq = LessEqualThan(32);

    geq.in[0] <== amount;
    geq.in[1] <== minAmount;

    leq.in[0] <== amount;
    leq.in[1] <== maxAmount;

    // Valid if both constraints satisfied
    isValid <== geq.out * leq.out;
}

// Simple comparison templates for demo
template GreaterEqualThan(n) {
    assert(n <= 252);
    signal input in[2];
    signal output out;

    component lt = LessThan(n+1);
    lt.in[0] <== in[1];
    lt.in[1] <== in[0] + 1;
    out <== lt.out;
}

template LessEqualThan(n) {
    assert(n <= 252);
    signal input in[2];
    signal output out;

    component lt = LessThan(n+1);
    lt.in[0] <== in[0];
    lt.in[1] <== in[1] + 1;
    out <== lt.out;
}

template LessThan(n) {
    assert(n <= 252);
    signal input in[2];
    signal output out;

    component n2b = Num2Bits(n);
    n2b.in <== in[0] + (1<<n) - in[1];
    out <== 1 - n2b.out[n];
}

template Num2Bits(n) {
    signal input in;
    signal output out[n];
    var lc1=0;

    var e2=1;
    for (var i = 0; i<n; i++) {
        out[i] <-- (in >> i) & 1;
        out[i] * (out[i] -1 ) === 0;
        lc1 += out[i] * e2;
        e2 = e2+e2;
    }

    lc1 === in;
}

// Main component
component main = SimpleOmamoriProof();