import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import emailInfo from "./util/EMAIL_INFO";
import { MAIL_COUNT } from "./util/MAIL_COUNT";
import fs from "fs";
import path from "path";
import { EMAIL_BODY_FILES } from "./util/EMAIL_BODY_FILES";
import { EmailSubject } from "./Email_body/Subject";


//*--------------
const app = express();
app.use(express.json())
app.use(cors())
require('dotenv').config(); 
let EMAIL_BODY:Mail[] = emailInfo;
const email_body_count = EMAIL_BODY_FILES;
const email_sender = process.env.GMAIL_USER;
const email_subj = EmailSubject;
//*--------------

const auth = nodemailer.createTransport({
    service: "gmail",
    secure : true,
    port : 465,
    auth: {
        user: email_sender,
        pass: process.env.GMAIL_PASSWORD
    }
});

//*---------------
interface Mail {
    NAME?:string
    EMAIL_RECEIVER: string; 
    COMPANY: string;
    TYPE: string;
}

type AppendedMailBody = {
    mails: Mail[];
};

//*---------------
let current_email_index = 0;

setInterval(async()=>{
   if(current_email_index < EMAIL_BODY.length){
    const company = EMAIL_BODY[current_email_index].COMPANY;
    const email_receiver = EMAIL_BODY[current_email_index].EMAIL_RECEIVER;
    const name = EMAIL_BODY[current_email_index].NAME;
    let cType = EMAIL_BODY[current_email_index].TYPE;
    cType = cType.charAt(0).toUpperCase() + cType.slice(1).toLowerCase();

    current_email_index++;

    const email_Sub_Index = getOneRandomNumber()-1;

    let emailSubject = email_subj[email_Sub_Index];
    if (emailSubject.includes("[COMPANY]")) {
        emailSubject = emailSubject.replace("[COMPANY]", company);
    }

    const rNumber = randomNumberGenerator();
    let fileName = "";
    let emailtext = "";
    if(name){
        fileName = `en${rNumber}.txt`;
        const a = path.join("src","Email_body","With-name",fileName)
        let data = fs.readFileSync(a,"utf-8");
        data = data.replace("[COMPANY]",company);
        data = data.replace("[TYPE]",cType);
        data = data.replace("[Name]",name);
        emailtext = data;

    }
    else if(!name){
        fileName = `e${rNumber}.txt`;
        const a = path.join("src","Email_body","Without-name",fileName)
        let data  = fs.readFileSync(a,"utf-8");
        data = data.replace("[COMPANY]",company);
        data = data.replace("[TYPE]",cType);
        emailtext = data;
    }

    const receiver = {
        from : email_sender,
        to : email_receiver,
        subject : emailSubject,
        text : emailtext,
        attachments: [
            {
              filename: 'Resume.pdf',
              path: path.join("src","File","Resume.pdf") 
            },
        ]
    };
        // try {
        //     auth.sendMail(receiver, (error, emailResponse) => {
        //         if(error)
        //         throw error;
        //         });
        // } catch (error) {
        //     console.log("OOPS error->",error)
        // }
       
   }
   else{
    current_email_index = 0;
   }
}
,(86400000/(MAIL_COUNT*EMAIL_BODY.length)))
// ,10000/(MAIL_COUNT*EMAIL_BODY.length))

app.get("/",(req,res)=>{
    return res.json({message:"HELLO"}).status(200);
})

app.get("/all-emails",(req,res)=>{
    try {
        return res.json(EMAIL_BODY).status(200);
    } catch (error) {
        return res.json({message:"Something bad happened !!"}).status(400);
    }
})

app.post("/append-emails",async(req,res)=>{
   try {
    const {mails}:AppendedMailBody = req.body;
    let error = false;
    mails.forEach((item)=>{
        if(item.TYPE !== "COMPANY" && item.TYPE !== "STARTUP" ){
            error = true;
        }
    })
    if(error){
        return res.json({message:"TYPE SHOULD BE EITHER COMPANY OR STARTUP"}).status(400);
    }
    const email_path = path.join("src","util","EMAIL_INFO.ts")

    const newMails = mails.filter(mail => !emailExists(mail, EMAIL_BODY));
    EMAIL_BODY = [...EMAIL_BODY, ...newMails];
    const updatedContent = `const emailInfo = ${JSON.stringify(EMAIL_BODY, null, 2)};\n\nexport default emailInfo;`;
    fs.writeFileSync(email_path, updatedContent, 'utf-8');

    return res.json({message:"Added more emails successfully !!"}).status(200);
   } catch (error) {
    return res.json({message:"Something bad happened !!"}).status(400);
   }
})

app.post("/delete-emails",async(req,res)=>{
    const {mails}:AppendedMailBody = req.body;
    const email_path = path.join("src","util","EMAIL_INFO.ts")
    const filteredEmailInfo = EMAIL_BODY.filter(
        email => !mails.some(mail => isMatchingMail(email, mail))
    );
    EMAIL_BODY = filteredEmailInfo;
    const updatedContent = `const emailInfo = ${JSON.stringify(filteredEmailInfo, null, 2)};\n\nexport default emailInfo;`;
    
    fs.writeFileSync(email_path, updatedContent, 'utf-8');
    return res.json({message:"Deleted emails successfully !!"}).status(200);
})

const isMatchingMail = (mail: Mail, compare: Mail) => mail.EMAIL_RECEIVER === compare.EMAIL_RECEIVER;

const emailExists = (email: Mail, emailList: Mail[]): boolean => 
        emailList.some(existingEmail => 
        existingEmail.EMAIL_RECEIVER === email.EMAIL_RECEIVER && 
        existingEmail.COMPANY === email.COMPANY
);

const randomNumberGenerator = ()=>{
    const number =  Math.floor(Math.random() * email_body_count) + 1;
    return number; 
}

function getOneRandomNumber() {
    return Math.floor(Math.random() * email_subj.length) + 1;
}
app.listen(5000);