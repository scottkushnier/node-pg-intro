/** BizTime express application. */

const express = require("express");

const app = express();
const ExpressError = require("./expressError");
const db = require("./db");

app.use(express.json());

app.get("/companies", async function (req, res, next) {
  try {
    const results = await db.query("SELECT * FROM companies");
    return res.json({ companies: results.rows });
  } catch (err) {
    next(err);
  }
});

app.get("/companies/:code", async function (req, res, next) {
  try {
    const code = req.params.code;
    // console.log("code:", code);
    const results = await db.query("SELECT * FROM companies WHERE code = $1", [
      code,
    ]);
    if (results.rows.length) {
      const invoices = await db.query(
        "SELECT * FROM invoices WHERE comp_code = $1",
        [code]
      );
      return res.json({
        company: { ...results.rows[0], invoices: invoices.rows },
      });
    } else {
      return res.status(404).json("error");
    }
    // return res.json("ok");
  } catch (err) {
    next(err);
  }
});

app.post("/companies", async function (req, res, next) {
  try {
    data = req.body;
    // console.log("data:", data);
    const results = await db.query(
      "INSERT INTO companies (code, name, description) VALUES ($1, $2, $3);",
      [data.code, data.name, data.description]
    );
    return res.json({ company: data });
  } catch (err) {
    next(err);
  }
});

app.put("/companies/:code", async function (req, res, next) {
  try {
    const code = req.params.code;
    data = req.body;
    const result = await db.query(
      "UPDATE companies SET name = $1, description = $2 WHERE code = $3;",
      [data.name, data.description, code]
    );
    if (result.rowCount) {
      return res.json({
        company: {
          code: code,
          name: data.name,
          description: data.description,
        },
      });
    } else {
      return res.status(404).json("error");
    }
  } catch (err) {
    next(err);
  }
});

app.delete("/companies/:code", async function (req, res, next) {
  try {
    const code = req.params.code;
    const results = await db.query("DELETE FROM companies WHERE code = $1", [
      code,
    ]);
    if (results.rowCount) {
      return res.json({ status: "deleted" });
    } else {
      return res.status(404).json("error");
    }
  } catch (err) {
    next(err);
  }
});

///////////////////////////////////////////////////////////////////////////

app.get("/invoices", async function (req, res, next) {
  try {
    const results = await db.query("SELECT * FROM invoices");
    return res.json({ invoices: results.rows });
  } catch (err) {
    next(err);
  }
});

app.get("/invoices/:id", async function (req, res, next) {
  try {
    const id = req.params.id;
    const results = await db.query("SELECT * FROM invoices WHERE id = $1", [
      id,
    ]);
    if (results.rows.length) {
      return res.json({ invoice: results.rows[0] });
    } else {
      return res.status(404).json("error");
    }
  } catch (err) {
    next(err);
  }
});

app.post("/invoices", async function (req, res, next) {
  try {
    data = req.body;
    // console.log(data);
    const results = await db.query(
      "INSERT INTO invoices (comp_code, amt, paid) VALUES ($1, $2, $3) RETURNING *;",
      [data.comp_code, data.amt, false]
    );
    // console.log(results);
    return res.json({ invoice: results.rows[0] });
  } catch (err) {
    next(err);
  }
});

app.put("/invoices/:id", async function (req, res, next) {
  try {
    const id = req.params.id;
    const { amt } = req.body;
    console.log("amt", amt);
    const invoiceResult = await db.query(
      "SELECT * FROM invoices WHERE id = $1",
      [id]
    );
    if (!invoiceResult.rowCount) {
      return res.status(404).json("error");
    }
    const invoice = invoiceResult.rows[0];
    // console.log("invoice", invoice);
    if (invoice.amt != amt) {
      console.log("wrong amount: was expecting: ", invoice.amt, " got: ", amt);
      return res.json("wrong amount");
    }
    if (invoice.paid) {
      console.log("invoice was already paid");
      return res.json("already paid");
    }
    const result = await db.query(
      "UPDATE invoices SET paid = true, paid_date = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
      [id]
    );
    // console.log("result:", result);
    if (result.rowCount) {
      return res.json({
        invoice: result.rows[0],
      });
    } else {
      return res.status(404).json("error");
    }
  } catch (err) {
    next(err);
  }
});

app.delete("/invoices/:id", async function (req, res, next) {
  try {
    const id = req.params.id;
    const results = await db.query("DELETE FROM invoices WHERE id = $1", [id]);
    if (results.rowCount) {
      return res.json({ status: "deleted" });
    } else {
      return res.status(404).json("error");
    }
  } catch (err) {
    next(err);
  }
});

/** 404 handler */

app.use(function (req, res, next) {
  const err = new ExpressError("Not Found", 404);
  return next(err);
});

/** general error handler */

app.use((err, req, res, next) => {
  res.status(err.status || 500);

  return res.json({
    error: err,
    message: err.message,
  });
});

module.exports = app;
