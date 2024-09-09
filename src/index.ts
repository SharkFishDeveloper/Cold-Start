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
let EMAIL_BODY = emailInfo;
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
    EMAIL_RECIEVER: string; 
    COMPANY: string;
    TYPE:"COMPANY"|"STARTUP"|string
  }

type AppenedMailBody ={
    mails: Mail[]; 
  };

//*---------------
let current_email_index = 0;

setInterval(()=>{
 
   if(current_email_index < EMAIL_BODY.length){
    const company = EMAIL_BODY[current_email_index].COMPANY;
    const email_receiver = EMAIL_BODY[current_email_index].EMAIL_RECIEVER;
    console.log(company,email_receiver,email_sender);
    current_email_index++;

    const receiver = {
        from : email_sender,
        to : email_receiver,
        subject : "Node Js Mail Testing!",
        text : "Hello this is a text mail!"
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
,2000)


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
    const {mails}:AppenedMailBody = req.body;
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
    const {mails}:AppenedMailBody = req.body;
    const email_path = path.join("src","util","EMAIL_INFO.ts")
    console.log("EMAIL INFO",EMAIL_BODY)
    const filteredEmailInfo = EMAIL_BODY.filter(
        email => !mails.some(mail => isMatchingMail(email, mail))
    );
    EMAIL_BODY = filteredEmailInfo;
    console.log("FILTERED",filteredEmailInfo);
    const updatedContent = `const emailInfo = ${JSON.stringify(filteredEmailInfo, null, 2)};\n\nexport default emailInfo;`;
    
    fs.writeFileSync(email_path, updatedContent, 'utf-8');
    return res.json({message:"Deleted emails successfully !!"}).status(200);
})

const isMatchingMail = (mail: Mail, compare: Mail) => mail.EMAIL_RECIEVER === compare.EMAIL_RECIEVER;

const emailExists = (email: Mail, emailList: Mail[]): boolean => 
        emailList.some(existingEmail => 
        existingEmail.EMAIL_RECIEVER === email.EMAIL_RECIEVER && 
        existingEmail.COMPANY === email.COMPANY
);

const randomNumberGenerator = ()=>{
    
}


app.listen(5000);