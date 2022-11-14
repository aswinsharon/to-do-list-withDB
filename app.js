const express = require('express');
const mongoose = require('mongoose')
const _ = require("lodash");
const app = express();
var workItems = [];
app.set('view engine','ejs');
app.use(express.urlencoded({extended:true}))
app.use(express.static("public")); //to use css
var defaultItems = [];

mongoose.connect('mongodb://127.0.0.1:27017/todolistDB'); //connecting to mongoDB

const ItemSchema = {
    name:String
}

const Item = mongoose.model(("Item"),ItemSchema);

const item1 = new Item({
    name:"welcome to your todolist"
})                                         //creating mongoose document
const item2 = new Item({
    name:"hit + button to add new item"
})
const item3 = new Item({
    name:"<-- hit this to delete item"
})

defaultItems = [item1,item2,item3]

const ListSchema = {

    name:String,
    items:[ItemSchema]
}

const List = mongoose.model("List",ListSchema);

app.get("/", function(req,res){
  
   Item.find({},(err,FoundItems)=>{
   
 if(FoundItems.length === 0){
   Item.insertMany(defaultItems,function(err){
    if(err){
        console.log(err);
    }
    else{
        console.log("Sucessfully inserted to db");
    }
 });
 res.redirect("/");
}else{
        res.render("list",{
            listTitle : "Today",
            newListItems : FoundItems
        });    
    }
})
});

app.get("/:customListName",(req,res)=>{

    var customListName = _.capitalize(req.params.customListName); //custom page
    List.findOne({name:customListName},(err,foundList)=>{  //find returns array
        //findOne returns object
            if(!err){
                  if(!foundList){
                    const list = new List({
                        name:customListName,
                        items:defaultItems
                    });
                    list.save();
                    res.redirect("/"+customListName)
                  }else{
                    res.render("list",{
                        listTitle : foundList.name,
                        newListItems : foundList.items
                    });  
                  }
              }                                           
    })
   
});

app.post("/", function(req,res){
    
    var itemName = req.body.newItem;
    var listName = req.body.list;
    var item = new Item({
        name:itemName
    })
    
    if(listName === "Today"){
        item.save();                    //<--- using instead of insert() or insertMany()
        res.redirect("/");
    }else{
        List.findOne({name:listName},function(err,foundList){
            foundList.items.push(item);
            foundList.save()
            res.redirect("/"+listName);    
        });
    }
});

app.post("/delete",(req,res)=>{
    
    var checkedItemId = req.body.checkbox;
    var listName = req.body.listName;

    if(listName === "Today"){

        Item.findByIdAndRemove(checkedItemId,(err)=>{

            if(err){
                console.log(err);
            }else{
                console.log("deleted successfully")
                res.redirect("/");
            }
        })
    }
       List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId}}},function(err,results){
            if(!err){
                res.redirect("/"+listName);
            }
         }
       )

})


app.get("/about",function(req,res){

    res.render("about");
})

app.listen(3000,function(){
    console.log("Server started on port 3000");
});