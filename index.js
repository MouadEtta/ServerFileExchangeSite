//IMPORTS
const multer = require('multer');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const mariadb=require('mariadb');
const fs = require('fs');
var express = require("express");
var config = require("./config");
var database = require("./database");
var mysql = require("mysql");
var bodyParser = require("body-parser");
var path = require("path");
const { Console } = require('console');
var router = express.Router();
var app = express();

const upload = multer({ dest: 'uploads/' });
const html="<h1>HELLOOOOO</h1> <p>allora</p>"
const transporter = nodemailer.createTransport({
  name:config.host,
  host:config.host,
  port:config.port,
  secure:false,
  auth: {
  user:config.user,
  pass:config.pass
  } ,
  tls: {
    rejectUnauthorized: false
}
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

router.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  next();
});


/*
 |--------------------------------------------------------------------------
 | ROUTER ROOT
 |--------------------------------------------------------------------------
 */
router.get("/", function (req, res) {
  res.status(200).send({ message: "API " + config.NODE_NAME });
});
//CHECKING IF THE USER IS IN THE DATABASE
router.post('/login', (req, res) => {
    let query="SELECT * FROM users WHERE (username = ? AND password = ?)or (email = ? AND password = ?)";
     database.pool.getConnection(function (err, connection){
      connection.query(query, [req.body.Username, req.body.Password,req.body.Username, req.body.Password],(error,results) => {
        if (error) 
        {
          res.status(500).json({ success: false});
        } 
        else 
        {
          if (results.length > 0) 
          {
            const token = jwt.sign({ userId: results[0].id,name: results[0].username,email: results[0].email }, 'secretKey');
            res.json({ success: true,token});
          } 
          else 
          {
            const token = jwt.sign({ userId: results }, 'secretKey');
            res.json({ success: false,token });
          }
        }
      });
      connection.release();
    })
      
  })
  //ADDING NEW USER TO THE DATABASE
  router.post('/signin', (req, res) => {
    let query="INSERT INTO users(username, email, password) VALUES (?,?,?) ";
          database.pool.getConnection(function (err, connection){
           connection.query(query, [req.body.Username, req.body.Email, req.body.Password],(error, results) => {
            if (error) 
            {

             res.status(500).json({ success: false});
            } 
            else 
            {
              res.json({ success: true});
            }
          });
        connection.release();
})
  })

//CHECKING IF USERNAME OR EMAIL ARE ALREADY IN THE DATABASE BEFORE SIGNING IN 
  router.post('/checkUser', (req, res) => {
    let query="SELECT * FROM users WHERE username=? or email=?";
      database.pool.getConnection(function (err, connection){
      connection.query(query, [req.body.Username, req.body.Email],(error, results) => {
      if (error) 
      {
        res.status(500).json({ success: false});
      } 
      else {

        if (results.length ==0) 
        {
          res.json({ success: true});
        } 
        else
         {
          res.json({ success: false, userid:results });
        }
      }
    });
    connection.release();
  })
})


router.post('/mainpage',upload.array('file'), (req, res) => {
  
const size = parseInt(req.body.size);
  const id=req.body.id;
  const files = req.files;
  for (let file of files) {
    console.log(size);
    //read file end convert to buffer
    const fileData = fs.readFileSync(file.path);
    const fileBuffer = Buffer.from(fileData);

    // inserting file in database
    const query = 'INSERT INTO file (name, type, content, user_id,size) VALUES (?, ?, ?, ?,?)';
    database.pool.getConnection(function (err, connection){
    connection.query(query, [file.originalname, file.mimetype, fileBuffer, id,req.body.size], (error, results) => {
      if (error) 
      {
        res.status(500).json({ success: false});
      } 
      else 
      {
        res.status(200).json(true);
      }
    });
    connection.release;
  })
  }

});

router.post('/mainpagee', upload.array('demo[]'), (req, res) => {
    // Effettua eventuali operazioni necessarie sull'upload dei file
    // ...

    // Invia una risposta di successo
    res.status(200).json({ message: 'Upload completato' });

});
//GET ALL THE FILES FROM THE DATABASE
router.get('/files', (req, res) => {

  let query ="SELECT name, type, size, user_id, id_file FROM file ";
     database.pool.getConnection(function (err, connection){
       connection.query(query, function (err, rows, flds) {
         if (err)
          {
           err.query = query;
            res.status(500).send({ message: err });
         } 
         else 
         {
            res.json(rows);
         }
       });
       connection.release();

     });
    
  })
    
  //DELETING  A FILE FROM THE DATABASE
  router.post('/delete', (req, res) => {
    let query="DELETE FROM file WHERE id_file=?";
    query = mysql.format(query, [req.body.id_file]);
    database.pool.getConnection(function (err, connection){
      connection.query(query,(error, results) => {
        if (error) 
        {
          res.status(500).json({ success: false});
        } else {

          res.status(200).json(true);
        }
      });
      connection.release();
    })
      
  })
  //DOWNLOADING FILE FROM DATABASE
  router.post('/download', (req, res) => {
    let query ="SELECT content  FROM file where id_file=?";
       database.pool.getConnection(function (err, connection){
         connection.query(query, [req.body.id_file], function (err, results) {
           if (err) 
           {
             err.query = query;
              res.status(500).send({ message: err });
           } else 
           {
            const fileData = results[0].content;
            res.send(fileData);
           }
         });
         connection.release();
  
       });
      
    })
    router.post('/sendlog', (req, res) => {
      console.log(req.body);
      let query ="INSERT INTO logs (user_id,file_name,action) VALUES (?, ?,?)";
         database.pool.getConnection(function (err, connection){
           connection.query(query, [req.body.id_user,req.body.file,req.body.action], function (err, results) {
             if (err) 
             {
               err.query = query;
                res.status(500).send({ message: err });
             } else 
             {
              console.log(results);
              res.status(200).json(true);
             }
           });
           connection.release();
    
         });
        
      })

      router.post('/sendemail', (req, res) => {
        let query ="SELECT content,name,type from file WHERE id_file= ? ";
           database.pool.getConnection(function (err, connection){
             connection.query(query, [req.body.id_file, ], function (err, results) {
               if (err) 
               {
                 err.query = query;
                  res.status(500).send({ message: err });
               } else 
               {
                console.log(results[0].content.length);

                var attachments = [];

               attachments[0]= {'filename': results[0].name, 'content':Buffer.from(results[0].content, 'binary')};

               
               console.log(attachments);
               //console.log(config.user+" "+config.pass);


                const mailOptions = {
                  from: config.user,
                  to: req.body.Destinatario,
                  subject: req.body.Asunto,
                  text: 'Contenuto del messaggio',
                  attachments: attachments,
                  html:this.html
                };
                transporter.sendMail(mailOptions, (error, info) => {
                  if (error) {
                    console.log('Errore nell\'invio dell\'email:', error);
                  } else {


                    
                    console.log('Email inviata con successo:', info);
                  }
                });
                res.json(results);
               }
             });
             connection.release();
      
           });
          
        })

    //GET ALL THE FILES FROM THE DATABASE
router.get('/logs', (req, res) => {

  let query ="SELECT logs.*, users.* FROM logs INNER JOIN users ON logs.user_id = users.id;";
     database.pool.getConnection(function (err, connection){
       connection.query(query, function (err, rows, flds) {
         if (err)
          {
            console.log("dfsfdsfds");
           err.query = query;
            res.status(500).send({ message: err });
         } 
         else 
         {
          console.log(rows);

            res.json(rows);
         }
       });
       connection.release();

     });
    
  })
  router.get('/getusers', (req, res) => {

  let query ="SELECT username,email FROM users";
     database.pool.getConnection(function (err, connection){
       connection.query(query, function (err, rows, flds) {
         if (err)
          {
           err.query = query;
            res.status(500).send({ message: err });
         } 
         else 
         {
          console.log(rows);

            res.json(rows);
         }
       });
       connection.release();

     });
    
  })
      


module.exports.router = router;