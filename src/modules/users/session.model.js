import { getDB } from "../../config/db.js";

export const SessionModel = {
  async create(connection, data) {
    const {
      user_id,
      session_id,
      refresh_token_hash,
      ip_address,
      user_agent,
      expires_at,
    } = data;

    await connection.query(
      `
  INSERT INTO user_refresh_tokens
  (user_id, session_id, refresh_token_hash, ip_address, user_agent, expires_at)
  VALUES (?, ?, ?, ?, ?, ?)
  `,
      [
        user_id,
        session_id,
        refresh_token_hash,
        ip_address,
        user_agent,
        expires_at,
      ],
    );
  },
};
