const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
app.use(cors());

// ===== DB CONNECT =====
mongoose.connect("YOUR_MONGO_URI")
.then(()=>console.log("MongoDB Connected"))
.catch(err=>console.log(err));

// ===== MODELS =====
const User = mongoose.model("User", {
  name: String,
  email: String,
  password: String,
  role: String
});

const Project = mongoose.model("Project", {
  name: String,
  description: String,
  deadline: Date,
  status: String
});

const Task = mongoose.model("Task", {
  title: String,
  description: String,
  status: String
});

// ===== AUTH MIDDLEWARE =====
const auth = (req,res,next)=>{
  const token = req.headers.authorization;
  if(!token) return res.status(401).json("No token");

  try{
    const decoded = jwt.verify(token,"secret");
    req.user = decoded;
    next();
  }catch{
    res.status(401).json("Invalid token");
  }
};

// ===== ROUTES =====

// REGISTER
app.post("/api/register", async(req,res)=>{
  const {name,email,password,role} = req.body;
  const hash = await bcrypt.hash(password,10);
  const user = await User.create({name,email,password:hash,role});
  res.json(user);
});

// LOGIN
app.post("/api/login", async(req,res)=>{
  const user = await User.findOne({email:req.body.email});
  if(!user) return res.json("User not found");

  const ok = await bcrypt.compare(req.body.password,user.password);
  if(!ok) return res.json("Wrong password");

  const token = jwt.sign({id:user._id},"secret");
  res.json({token,user});
});

// PROJECT
app.post("/api/projects", auth, async(req,res)=>{
  const p = await Project.create(req.body);
  res.json(p);
});

app.get("/api/projects", auth, async(req,res)=>{
  const p = await Project.find();
  res.json(p);
});

// TASK
app.post("/api/tasks", auth, async(req,res)=>{
  const t = await Task.create(req.body);
  res.json(t);
});

app.get("/api/tasks", auth, async(req,res)=>{
  const t = await Task.find();
  res.json(t);
});

// SERVER
app.listen(5000, ()=>console.log("Server running"));