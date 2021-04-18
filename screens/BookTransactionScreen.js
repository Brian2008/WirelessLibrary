import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Image, KeyboardAvoidingView, ToastAndroid, Alert} from 'react-native';
import * as Permissions from 'expo-permissions';
import {BarCodeScanner} from 'expo-barcode-scanner';
import * as firebase from 'firebase';
import db from '../config';
export default class TransactionScreen extends React.Component{
    constructor(){
        super()
        this.state={
            hasCameraPermissions:null,
            scanned:false,
            scannedData:'',
            scannedBookID:'',
            scannedStudentID:'',
            buttonState:'normal',
            transactionMessage:''

        }
    }
    getCameraPermissions=async(id)=>{
        const {status} = await Permissions.askAsync(Permissions.CAMERA)
        this.setState({
            hasCameraPermissions:status==="granted",
            buttonState:id,
            scanned:false
        })
    }
    handleBarCodeScanned=async({type,data})=>{
        this.setState({
            scanned:true,
            scannedData:data,
            buttonState:'normal'
        })
    }
    checkBookEligibility=async()=>{
        const bookRef=await db
        .collection("books")
        .where("bookId","==",this.state.scannedBookID)
        .get()
        var transactionType=""
        if(bookRef.docs.length==0){
            transactionType=false
        }else{
            bookRef.docs.map(doc=>{
                var book = doc.data()
                if(book.bookAvailability){
                    transactionType="issue"
                }else{
                    transactionType="return"
                }
            });


        }
    }
    checkStudentEligibilityForBookIssue=async()=>{
        const studentRef=await db
        .collection("students")
        .where("studentID","==",this.state.scannedStudentID)
        .get()
        var isStudentEligible=""
        if(studentRef.docs.length==0){
            this.setState({
                scannedStudentID:"",
                scannedBookID:""
            });
            isStudentEligible=false
            Alert.alert("The student doesn't exist in the database.")
        }else{
            studentRef.docs.map(doc=>{
                var student = doc.data()
                if(student.numberOfBooksIssued<2){
                    isStudentEligible=true
                }else{
                    isStudentEligible=false
                    Alert.alert("The student has already issued 2 books.")
                    this.setState({
                        scannedStudentID:"",
                        scannedBookID:""
                    });
                }
            })
        }
        return isStudentEligible;
    }
    checkStudentEligibilityForBookReturn=async()=>{
        const transactionRef=await db
        .collection("transactions")
        .where("bookID","==",this.state.scannedBookID)
        .limit(1)
        .get()
        var isStudentEligible=""
            transactionRef.docs.map(doc=>{
                var lastBookTransaction = doc.data()
                if(lastBookTransaction.studentID===this.state.scannedStudentID){
                    isStudentEligible=true
                }else{
                    isStudentEligible=false
                    Alert.alert("The student didn't issue this book.")
                    this.setState({
                        scannedStudentID:"",
                        scannedBookID:""
                    });
                }
            })
            return isStudentEligible;
        
    }
    handleTransaction = async()=>{
        /*var transactionMessage
        db.collection.collection("books").doc(this.state.scannedBookID).get()
        .then((doc)=>{
            //console.log(doc.data());
            var book=doc.data()
            if(book.bookAvailability){
                this.initiateBookIssue()
                transactionMessage="bookIssue"
                ToastAndroid.show(transactionMessage,ToastAndroid.SHORT)
            }else{
                this.initiateBookReturn()
                transactionMessage="bookReturn"
                ToastAndroid.show(transactionMessage,ToastAndroid.SHORT)
            }
        })
        this.setState({
            transactionMessage:transactionMessage,
        })*/
        var transactionType = await this.checkBookEligibility()
        if(!TransactionType){
            Alert.alert("The book doesn't exist in the library.")
            this.setState({
                scannedStudentID:"",
                scannedBookID:""
            });
        }else if(transactionType==="issue"){
            var isStudentEligible = await this.checkStudentEligibilityForBookIssue()
            if(isStudentEligible){
                this.initiateBookIssue()
                Alert.alert("Book has been issued.")
            }else{
                var isStudentEligible = await this.checkStudentEligibilityForBookReturn()
                if(isStudentEligible){
                    this.initiateBookReturn()
                    Alert.alert("Book has been returned to the library.")
                } 
            }
        }
    }
    initiateBookIssue=async()=>{
        db.collection("transactions").add({
            studentId:this.state.scannedStudentID,
            bookId:this.state.scannedBookID,
            date:firebase.firestore.Timestamp.now().toDate(),
            transactionType:"issue"
        })
        db.collection("books").doc(this.state.scanBookId).update({
            bookAvailability:false
        })
        db.collection("students").doc(this.state.scanStudentId).update({
            numberOfBooksIssued:firebase.firestore.FieldValue.increment(1)
        })
        Alert.alert("Book Issued")
        this.setState({
            scannedBookID:'',
            scannedStudentID:''
        })
    }
    initiateBookReturn=async()=>{
        db.collection("transactions").add({
            studentId:this.state.scannedStudentID,
            bookId:this.state.scannedBookID,
            date:firebase.firestore.Timestamp.now().toDate(),
            transactionType:"return"
        })
        db.collection("books").doc(this.state.scanBookId).update({
            bookAvailability:true
        })
        db.collection("students").doc(this.state.scanStudentId).update({
            numberOfBooksIssued:firebase.firestore.FieldValue.increment(-1)
        })
        Alert.alert("Book Returned")
        this.setState({
            scannedBookID:'',
            scannedStudentID:''
        })
    }
    render() {
        const hasCameraPermissions=this.state.hasCameraPermissions;
        const scanned=this.state.scanned;
        const buttonState=this.state.buttonState;
    if(buttonState !=="normal"&& hasCameraPermissions){
            return(
                <BarCodeScanner
                onBarCodeScanned={
                    scanned?undefined:this.handleBarCodeScanned
                }
                style={StyleSheet.absoluteFill}
                />
            )
        }
        else if(buttonState==="normal"){
            return(
                <KeyboardAvoidingView style = {styles.container} behavior="padding" enabled>
                    <View>
                    <Image
                    source={require('../assets/booklogo.jpg')} style = {{width:40, height:40}}
                    />
                    <Text style={{textAlign: 'center', fontSize: 30}}>Wily</Text>
                    </View>
                    <View styles = {styles.inputView}>
                        <TextInput style={styles.inputBox} placeholder="BookID"
                        onChangeText={text=>this.setState({scannedBookID:text})}
                        value={this.state.scannedBookID}/>
                        <TouchableOpacity style = {styles.scanButton}
                        onPress={()=>{
                            this.getCameraPermissions('BookID')
                        }}> 
                    <Text style = {styles.buttonText}>Scan</Text>
                    </TouchableOpacity>
                    </View>
                    <View styles = {styles.inputView}>
                        <TextInput style={styles.inputBox} placeholder="StudentID"
                        onChangeText={text=>this.setState({scannedStudentID:text})}
                        value={this.state.scannedStudentID}/>
                        <TouchableOpacity style = {styles.scanButton}
                        onPress={()=>{
                            this.getCameraPermissions('StudentID')
                        }}> 
                    <Text style = {styles.buttonText}>Scan</Text>
                    </TouchableOpacity>
                    </View>
                    <TouchableOpacity style = {styles.submitButton}
                    onPress = {
                        async()=>{this.handleTransaction()
                        this.setState({
                            scannedBookID:'',
                            scannedStudentID:''
                        })}
                    }>
                        <Text style = {styles.submitButtonText}>Submit</Text>
                    </TouchableOpacity>
                        </KeyboardAvoidingView>
                        
               
            )
        }
    }
}
const styles = StyleSheet.create({
    container:{flex:1,
        justifyContent:'center',
        alignItems:'center'},
        displayText:{
            fontSize:10,
            textDecorationLine:'underline'
        },
        scanButton:{
            backgroundColor:'peachpuff',
            margin:10,
            padding:10,
            width: 50, 
            borderWidth: 1.5, 
            borderLeftWidth: 0
        },
        inputView:{
            flexDirection:'row',
            margin: 20 
        }, 
        inputBox:
        { 
            width: 200, 
            height: 40, 
            borderWidth: 1.5, 
            borderRightWidth: 0, 
            fontSize: 20 
        },
        buttonText:{
        fontSize: 15,
         textAlign: 'center',
          marginTop: 10
        },
        submitButton:{
            backgroundColor:'lightblue',
            width:100,
            height:50
        },
        submitButtonText:{
            padding:10,
            textAlign:'center',
            fontSize:20,
            fontWeight:'bold',
            color:'black',
        }
        
})