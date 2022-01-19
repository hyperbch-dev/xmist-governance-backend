INSERT OR ROLLBACK INTO proposals
(
	proposalId,
	title,
	content,
	options,
	snapshotBlock,
	endBlock
)
VALUES
(
	:proposalId,
	:title,
	:content,
	:options,
	:snapshotBlock,
	:endBlock
)
