-- CreateTable "Staff"
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "skills" JSONB,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable "Ticket"
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "summary" TEXT,
    "assignedStaffId" TEXT,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable "TicketEmbedding"
CREATE TABLE "TicketEmbedding" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "embedding" BYTEA NOT NULL,

    CONSTRAINT "TicketEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable "AuditEvent"
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Staff_email_key" ON "Staff"("email");
