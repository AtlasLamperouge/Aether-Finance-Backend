const express = require("express");
const fs = require("fs");
const app = express();
app.use(express.json());

const DB_FILE = "./database.json";


if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(
        DB_FILE,
        JSON.stringify(
            {
                funds: 0,
                requests: []
            },
            null,
            2
        )
    );
}

function loadDB() {
    return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}


app.post("/webhook/sale", (req, res) => {
    const { price } = req.body;
    const db = loadDB();

    db.funds += price;
    saveDB(db);

    return res.json({ message: "Funds updated", funds: db.funds });
});


app.get("/funds", (req, res) => {
    const db = loadDB();
    res.json({ funds: db.funds });
});


app.post("/request", (req, res) => {
    const { user, amount } = req.body;
    const db = loadDB();

    const remaining = db.funds - amount;

    const request = {
        id: db.requests.length + 1,
        user,
        amount,
        status: remaining >= 0 ? "approved" : "denied",
        timestamp: Date.now()
    };

    if (remaining >= 0) {
        db.funds -= amount;
    }

    db.requests.push(request);
    saveDB(db);

    res.json({
        message:
            request.status === "approved"
                ? `Approved. Remaining funds: ${db.funds}`
                : `Denied. Not enough funds.`,
        request
    });
});

app.listen(3000, () => console.log("Backend running on port 3000"));
