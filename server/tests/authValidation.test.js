import test from "node:test";
import assert from "node:assert/strict";
import { loginSchema, registrationSchema } from "../lib/authValidation.js";

const validRegistration = {
  email: "Candidate@Example.com",
  password: "correct-horse-battery",
  first_name: "Amina",
  surname: "Nujoma",
  id_number: "1234567890",
};

test("registration normalizes email and ID while preserving separate fields", () => {
  const parsed = registrationSchema.parse({ ...validRegistration, id_number: " 1234567890 " });
  assert.equal(parsed.email, "candidate@example.com");
  assert.equal(parsed.id_number, "1234567890");
});

test("registration rejects an ID number in the email field", () => {
  const result = registrationSchema.safeParse({ ...validRegistration, email: "1234567890" });
  assert.equal(result.success, false);
});

test("registration rejects an email address in the ID field", () => {
  const result = registrationSchema.safeParse({ ...validRegistration, id_number: "candidate@example.com" });
  assert.equal(result.success, false);
});

test("registration rejects role and unknown fields", () => {
  const result = registrationSchema.safeParse({ ...validRegistration, role: "admin" });
  assert.equal(result.success, false);
});

test("login requires a numeric ID number and rejects email-based login", () => {
  assert.equal(loginSchema.safeParse({ idNumber: "1234567890", password: "test-password" }).success, true);
  assert.equal(loginSchema.safeParse({ idNumber: "candidate@example.com", password: "test-password" }).success, false);
  assert.equal(loginSchema.safeParse({ email: "candidate@example.com", password: "test-password" }).success, false);
});

test("registration enforces password length and bcrypt byte limits", () => {
  assert.equal(registrationSchema.safeParse({ ...validRegistration, password: "short" }).success, false);
  assert.equal(registrationSchema.safeParse({ ...validRegistration, password: "é".repeat(37) }).success, false);
});