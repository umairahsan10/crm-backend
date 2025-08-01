-- Check current transaction sequence
SELECT 
    schemaname,
    sequencename,
    last_value,
    start_value,
    increment_by,
    max_value,
    min_value,
    cache_value,
    is_cycled,
    is_called
FROM pg_sequences 
WHERE sequencename LIKE '%transaction%';

-- Check current max transaction ID
SELECT MAX(id) as max_transaction_id FROM transactions;

-- Check for any gaps or issues in transaction IDs
SELECT 
    id,
    LAG(id) OVER (ORDER BY id) as prev_id,
    id - LAG(id) OVER (ORDER BY id) as gap
FROM transactions 
ORDER BY id;

-- Reset sequence if needed (uncomment if sequence is out of sync)
-- SELECT setval('transactions_transaction_id_seq', (SELECT MAX(id) FROM transactions), true); 