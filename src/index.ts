import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import emailInfo from "./util/EMAIL_INFO";
import { email_duration_time } from "./util/DURATION";
import { MAIL_COUNT } from "./util/MAIL_COUNT";


//*--------------
const app = express();
app.use(express.json())
app.use(cors())
require('dotenv').config(); 
const email_duration = email_duration_time; //! this time should be 24hr / mail_count
const EMAIL_BODY = emailInfo;
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
,60000)


app.get("/",(req,res)=>{
    return res.send("HELLO")
})

app.get("/all-emails",(req,res)=>{
    return res.send(emailInfo)
})


app.listen(5000);