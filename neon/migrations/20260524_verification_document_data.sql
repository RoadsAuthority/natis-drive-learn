alter table verification_documents
  add column if not exists id_copy_data text,
  add column if not exists passport_copy_data text,
  add column if not exists face_capture_data text;
