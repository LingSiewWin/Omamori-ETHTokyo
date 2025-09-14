pragma circom 2.0.0;

// OMAMORI ZK-SNARK Circuit for JSC Privacy Layer
// Simplified demo circuit for triple-track competition
// Senior Web3 Engineering for Triple-Track Win

template OmamoriPrivacyProof() {
    // Private inputs (hidden from verifier)
    signal private input amount;        // Actual deposit amount
    signal private input salt;          // Random salt for uniqueness

    // Public inputs (visible to verifier)
    signal input minThreshold;          // Minimum deposit threshold
    signal input maxThreshold;          // Maximum deposit threshold
    signal input commitmentHash;        // Expected hash commitment

    // Public outputs
    signal output validDeposit;         // 1 if deposit is valid, 0 otherwise
    signal output proofHash;           // Proof hash for verification

    // Internal signals
    signal amountSquared;
    signal saltSquared;
    signal computedHash;
    signal minCheck;
    signal maxCheck;
    signal rangeCheck;

    // Square the private inputs for hashing
    amountSquared <== amount * amount;
    saltSquared <== salt * salt;

    // Simple hash function (amount^2 + salt^2 + constant)
    computedHash <== amountSquared + saltSquared + 12345;

    // Verify the commitment
    commitmentHash === computedHash;

    // Range checks: minThreshold <= amount <= maxThreshold
    // Using quadratic constraints for demo
    component minCheckComp = GreaterEqualThan(32);
    component maxCheckComp = LessEqualThan(32);

    minCheckComp.in[0] <== amount;
    minCheckComp.in[1] <== minThreshold;
    minCheck <== minCheckComp.out;

    maxCheckComp.in[0] <== amount;
    maxCheckComp.in[1] <== maxThreshold;
    maxCheck <== maxCheckComp.out;

    // Both checks must pass
    rangeCheck <== minCheck * maxCheck;
    validDeposit <== rangeCheck;

    // Generate proof hash
    proofHash <== computedHash + amount + salt;
}

// Range check helper templates
template LessEqualThan(n) {
    assert(n <= 252);
    signal input in[2];
    signal output out;

    component lt = LessThan(n+1);
    lt.in[0] <== in[0];
    lt.in[1] <== in[1]+1;
    lt.out ==> out;
}

template GreaterEqualThan(n) {
    assert(n <= 252);
    signal input in[2];
    signal output out;

    component lt = LessThan(n);
    lt.in[0] <== in[1];
    lt.in[1] <== in[0]+1;
    lt.out ==> out;
}

template LessThan(n) {
    assert(n <= 252);
    signal input in[2];
    signal output out;

    component n2b = Num2Bits(n);
    n2b.in <== in[0]+ (1<<n) - in[1];

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

// Poseidon hash function (simplified for demo)
template Poseidon(nInputs) {
    signal input inputs[nInputs];
    signal output out;

    // Simplified Poseidon implementation for hackathon
    // In production, use full Poseidon specification
    var sum = 0;
    for (var i = 0; i < nInputs; i++) {
        sum += inputs[i];
    }

    out <== sum * sum + 12345; // Simple hash for demo
}

// Main component
component main = OmamoriPrivacyProof();