"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const EMAIL_INFO_1 = __importDefault(require("./util/EMAIL_INFO"));
const DURATION_1 = require("./util/DURATION");
const MAIL_COUNT_1 = require("./util/MAIL_COUNT");
//*--------------
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
require('dotenv').config();
const email_duration = DURATION_1.email_duration_time; //! this time should be 24hr / mail_count
const EMAIL_BODY = EMAIL_INFO_1.default;
const mail_count = MAIL_COUNT_1.MAIL_COUNT;
const email_sender = process.env.GMAIL_USER;
//*--------------
const auth = nodemailer_1.default.createTransport({
    service: "gmail",
    secure: true,
    port: 465,
    auth: {
        user: email_sender,
        pass: process.env.GMAIL_PASSWORD
    }
});
let current_email_index = 0;
setInterval(() => {
    if (current_email_index < EMAIL_BODY.length) {
        const company = EMAIL_BODY[current_email_index].COMPANY;
        const email_receiver = EMAIL_BODY[current_email_index].EMAIL_RECIEVER;
        console.log(company, email_receiver, email_sender);
        current_email_index++;
        const receiver = {
            from: email_sender,
            to: email_receiver,
            subject: "Node Js Mail Testing!",
            text: "Hello this is a text mail!"
        };
        // console.log("BDY->",receiver)
        try {
            auth.sendMail(receiver, (error, emailResponse) => {
                if (error)
                    throw error;
            });
        }
        catch (error) {
            console.log("OOPS error->", error);
        }
    }
    else {
        current_email_index = 0;
    }
}, 10000);
app.get("/", (req, res) => {
    return res.send("HELLO");
});
app.get("/all-emails", (req, res) => {
    return res.send(EMAIL_INFO_1.default);
});
app.listen(5000);
