import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import emailInfo from "./util/EMAIL_INFO";
import { email_duration_time } from "./util/DURATION";
import { MAIL_COUNT } from "./util/MAIL_COUNT";
import fs from "fs";
import path from "path";


//*--------------
const app = express();
app.use(express.json())
app.use(cors())
require('dotenv').config(); 
const email_duration = email_duration_time; //! this time should be 24hr / mail_count
let EMAIL_BODY:Mail[] = emailInfo;
const mail_count = MAIL_COUNT;
const email_sender = process.env.GMAIL_USER;
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

setInterval(()=>{
   if(current_email_index < EMAIL_BODY.length){
    const company = EMAIL_BODY[current_email_index].COMPANY;
    const email_receiver = EMAIL_BODY[current_email_index].EMAIL_RECEIVER;
    console.log(company,email_receiver,email_sender);
    current_email_index++;

    const receiver = {
        from : email_sender,
        to : email_receiver,
        subject : "Node Js Mail Testing!",
        text : "Hello this is a text mail!",
        attachments: [
            {
              filename: 'My-resume', // The name of the attachment file
              path: path.join("src","File","Resume.pdf") // Full path to the file
            },
        ]
    };
    console.log(path.join("src","File","Resume.pdf"));
        try {
            auth.sendMail(receiver, (error, emailResponse) => {
                if(error)
                throw error;
                });
        } catch (error) {
            console.log("OOPS error->",error)
        }
       
   }
   else{
    current_email_index = 0;
   }
}
,10000)


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
    
}


app.listen(5000);