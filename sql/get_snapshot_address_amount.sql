SELECT amount
FROM proposals
LEFT JOIN snapshots USING (snapshotBlock)
WHERE proposalId = :proposalId
AND address = :address
