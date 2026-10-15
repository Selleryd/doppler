import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// Contact requests only. Do not add symptoms, diagnoses or clinical narratives.
export const leads = sqliteTable("leads", {
  id: text("id").primaryKey(),
  idempotencyKey: text("idempotency_key").notNull(),
  fingerprint: text("fingerprint").notNull(),
  kind: text("kind").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().default(""),
  phone: text("phone").notNull().default(""),
  state: text("state").notNull(),
  contactPreference: text("contact_preference").notNull(),
  fieldsJson: text("fields_json").notNull(),
  consent: integer("consent", { mode: "boolean" }).notNull(),
  status: text("status").notNull().default("queued"),
  providerMessageId: text("provider_message_id"),
  lastError: text("last_error"),
  attempts: integer("attempts").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  uniqueIndex("leads_idempotency_unique").on(table.idempotencyKey),
  index("leads_created_at_index").on(table.createdAt),
  index("leads_status_index").on(table.status),
]);

// Only irreversible IP hashes are retained, for short-window spam control.
export const leadRateLimits = sqliteTable("lead_rate_limits", {
  bucket: text("bucket").primaryKey(),
  count: integer("count").notNull().default(1),
  expiresAt: integer("expires_at").notNull(),
});
