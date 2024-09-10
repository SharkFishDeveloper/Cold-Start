"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const EMAIL_BODY_FILES_1 = require("./util/EMAIL_BODY_FILES");
const Subject_1 = require("./Email_body/Subject");
//*--------------
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
require('dotenv').config();
const email_duration = DURATION_1.email_duration_time; //! this time should be 24hr / mail_count
let EMAIL_BODY = EMAIL_INFO_1.default;
const mail_count = MAIL_COUNT_1.MAIL_COUNT;
const email_body_count = EMAIL_BODY_FILES_1.EMAIL_BODY_FILES;
const email_sender = process.env.GMAIL_USER;
const email_subj = Subject_1.EmailSubject;
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
//*---------------
let current_email_index = 0;
setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
    if (current_email_index < EMAIL_BODY.length) {
        const company = EMAIL_BODY[current_email_index].COMPANY;
        const email_receiver = EMAIL_BODY[current_email_index].EMAIL_RECEIVER;
        const name = EMAIL_BODY[current_email_index].NAME;
        const cType = EMAIL_BODY[current_email_index].TYPE;
        current_email_index++;
        const email_Sub_Index = getOneRandomNumber() - 1;
        let emailSubject = email_subj[email_Sub_Index];
        if (emailSubject.includes("[COMPANY]")) {
            emailSubject = emailSubject.replace("[COMPANY]", company);
        }
        const rNumber = randomNumberGenerator();
        let fileName = "";
        let emailtext = "";
        if (name) {
            fileName = `en${rNumber}.txt`;
            const a = path_1.default.join("src", "Email_body", "With-name", fileName);
            let data = fs_1.default.readFileSync(a, "utf-8");
            data = data.replace("[COMPANY]", company);
            data = data.replace("[TYPE]", cType);
            data = data.replace("[Name]", name);
            emailtext = data;
        }
        else if (!name) {
            fileName = `e${rNumber}.txt`;
            const a = path_1.default.join("src", "Email_body", "Without-name", fileName);
            let data = fs_1.default.readFileSync(a, "utf-8");
            data = data.replace("[COMPANY]", company);
            data = data.replace("[TYPE]", cType);
            emailtext = data;
        }
        const receiver = {
            from: email_sender,
            to: email_receiver,
            subject: emailSubject,
            text: emailtext,
            attachments: [
                {
                    filename: 'Resume.pdf',
                    path: path_1.default.join("src", "File", "Resume.pdf")
                },
            ]
        };
        console.log(receiver);
        // try {
        //     auth.sendMail(receiver, (error, emailResponse) => {
        //         if(error)
        //         throw error;
        //         });
        // } catch (error) {
        //     console.log("OOPS error->",error)
        // }
    }
    else {
        current_email_index = 0;
    }
}), (86400000 / MAIL_COUNT_1.MAIL_COUNT));
// ,5000)
app.get("/", (req, res) => {
    return res.json({ message: "HELLO" }).status(200);
});
app.get("/all-emails", (req, res) => {
    try {
        return res.json(EMAIL_BODY).status(200);
    }
    catch (error) {
        return res.json({ message: "Something bad happened !!" }).status(400);
    }
});
app.post("/append-emails", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { mails } = req.body;
        let error = false;
        mails.forEach((item) => {
            if (item.TYPE !== "COMPANY" && item.TYPE !== "STARTUP") {
                error = true;
            }
        });
        if (error) {
            return res.json({ message: "TYPE SHOULD BE EITHER COMPANY OR STARTUP" }).status(400);
        }
        const email_path = path_1.default.join("src", "util", "EMAIL_INFO.ts");
        const newMails = mails.filter(mail => !emailExists(mail, EMAIL_BODY));
        EMAIL_BODY = [...EMAIL_BODY, ...newMails];
        const updatedContent = `const emailInfo = ${JSON.stringify(EMAIL_BODY, null, 2)};\n\nexport default emailInfo;`;
        fs_1.default.writeFileSync(email_path, updatedContent, 'utf-8');
        return res.json({ message: "Added more emails successfully !!" }).status(200);
    }
    catch (error) {
        return res.json({ message: "Something bad happened !!" }).status(400);
    }
}));
app.post("/delete-emails", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { mails } = req.body;
    const email_path = path_1.default.join("src", "util", "EMAIL_INFO.ts");
    const filteredEmailInfo = EMAIL_BODY.filter(email => !mails.some(mail => isMatchingMail(email, mail)));
    EMAIL_BODY = filteredEmailInfo;
    const updatedContent = `const emailInfo = ${JSON.stringify(filteredEmailInfo, null, 2)};\n\nexport default emailInfo;`;
    fs_1.default.writeFileSync(email_path, updatedContent, 'utf-8');
    return res.json({ message: "Deleted emails successfully !!" }).status(200);
}));
const isMatchingMail = (mail, compare) => mail.EMAIL_RECEIVER === compare.EMAIL_RECEIVER;
const emailExists = (email, emailList) => emailList.some(existingEmail => existingEmail.EMAIL_RECEIVER === email.EMAIL_RECEIVER &&
    existingEmail.COMPANY === email.COMPANY);
const randomNumberGenerator = () => {
    const number = Math.floor(Math.random() * email_body_count) + 1;
    return number;
};
function getOneRandomNumber() {
    return Math.floor(Math.random() * email_subj.length) + 1;
}
app.listen(5000);
