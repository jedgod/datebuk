-- Verify the Staff table structure
\d "Staff"

-- Verify other tables
\d "Ticket"
\d "TicketEmbedding"
\d "AuditEvent"

-- Count rows in each table
SELECT 'Staff' as table_name, COUNT(*) as row_count FROM "Staff"
UNION ALL
SELECT 'Ticket', COUNT(*) FROM "Ticket"
UNION ALL
SELECT 'TicketEmbedding', COUNT(*) FROM "TicketEmbedding"
UNION ALL
SELECT 'AuditEvent', COUNT(*) FROM "AuditEvent";
