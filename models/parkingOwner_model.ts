import { DatabaseError } from "pg"
import pool from "./connectionPool"
import * as me from "./errors"

export async function create(email: string, password: string,
  lat: number | undefined, lon: number | undefined) {
  try {
    await pool.query("INSERT INTO parking_owners (email, password_hash, lat, lon) VALUES ($1, $2, $3, $4);", [email, password, lat || null, lon || null])
  } catch (err: any) {
    if (err instanceof DatabaseError) {
      if (err.code == "23505") {
        return { type: me.DuplError }
      } else {
        return { type: me.UnknownError }
      }
    }
  }
  return null
}

export async function fetchPass(email: string) {
  try {
    var result = await pool.query("SELECT password_hash FROM parking_owners WHERE email = $1;", [email])
    if (result.rowCount === null) {
      return { type: me.NotExistError }
    }
    if (result.rowCount < 1) {
      return { type: me.NotExistError }
    }
    console.log("result rows: ")
    console.log(result.rows)
    console.log("done")
    return { type: me.NoError, passHash: result.rows[0].password_hash}
  } catch (err: any) {
    return { type: me.UnknownError }
  }
}

export async function setPass(email: string, passHash: string) {
  try {
    await pool.query("UPDATE parking_owners SET password_hash = $2 WHERE email = $1;", [email, passHash])
  } catch (err: any) {
    return { type: me.UnknownError }
  }
  return {type: me.NoError}
}

export async function setLocation(email: string, lat: number, lon: number) {
  try {
    await pool.query("UPDATE parking_owners SET lat = $2, lon = $3 WHERE email = $1;", [email, lat, lon])
  } catch (err: any) {
    return { type: me.UnknownError }
  }
  return {type: me.NoError}
}

export async function fetchProfile(email: string) {
  try {
    var result = await pool.query("SELECT email, lat, lon, payment_policy, balance FROM parking_owners WHERE email = $1;", [email])
    if (result.rowCount === null || result.rowCount < 1) {
      return { type: me.NotExistError }
    }
    return { type: me.NoError, 
      email: result.rows[0].email, 
      lat: result.rows[0].lat, 
      lon: result.rows[0].lon, 
      balance: result.rows[0].balance,
      paymentPolicy: result.rows[0].payment_policy 
    }
  } catch (err: any) {
    return { type: me.UnknownError }
  }
}

export async function createToken(email: string, token: string) {
  pool.query("INSERT INTO parking_owners_sessions (email, session_key) VALUES ($1, $2);", [email, token])
}

export async function verifyToken(token: string) {
  try {
    var result = await pool.query("SELECT email FROM parking_owners_sessions WHERE session_key = $1;", [token])
    if (result.rowCount == null || result.rowCount == 0) {
      return { type: me.NotExistError }
    }
    console.log("Fetched email for token: ", result.rows[0].email)
    return result.rows[0].email
  } catch (err: any) {
    return { type: me.UnknownError }
  }
}

export async function verifyPaymentStatus(sessionID: string) {
  try {
    console.log(sessionID)
    var result = await pool.query("SELECT payment_status FROM sessions WHERE session_id = $1;", [sessionID])
    console.log(result.rows)
    if (result.rows.length == 0) {
      return { type: me.NotExistError }
    }
    var verified = (result.rows[0].payment_status == 1)
    return { type: me.NoError, verified: verified }
  } catch (err: any) {
    console.log(err)
    return { type: me.UnknownError }
  }
}

export async function getBalance(email: string) {
  const res = await pool.query("SELECT balance FROM parking_owners WHERE email = $1;", [email])
  if (res.rows.length > 0) {
    return { type: me.NoError, balance: res.rows[0].balance }
  } else {
    return { type: me.UnknownError }
  }
}

export async function getPaymentPolicy(email: string) {
  const res = await pool.query("SELECT payment_policy FROM parking_owners WHERE email = $1;", [email])
  if (res.rowCount == 0) {
    return { type: me.NotExistError }
  } else {
    return { type: me.NoError, policy: res.rows[0].payment_policy }
  }
}

export async function setPaymentPolicy(email: string, paymentPolicy: number) {
  const res = await pool.query("UPDATE parking_owners SET payment_policty = $2 WHERE email = $1;", [email, paymentPolicy])
  if (res.rowCount == 0) {
    return { type: me.NotExistError }
  } else {
    return { type: me.NoError }
  }
}
