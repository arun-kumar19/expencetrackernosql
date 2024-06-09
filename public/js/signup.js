 document.getElementById("submitsignupform").addEventListener('click',UserSignUp);

 async function UserSignUp(e){
    e.preventDefault();
    const name=document.getElementById('name').value;
    const email=document.getElementById('email').value;
    const password=document.getElementById('password').value;
    if(name && email && password){
    const user={
      name:name,
      email:email,
      password:password
    }
  console.log('form data=',user);
  const response=await axios.post('/signup',user);
  
  const status=response.data.status;
  console.log('response data=',status);
  if(status==1){
  
    alert('user created successfully. Login Now');
  //  document.getElementById('message').innerHTML=`<a href='/'>Login Now</a>`
    document.getElementById('name').value='';
    document.getElementById('email').value='';
    document.getElementById('password').value='';
    redirecttohome();
  }
  if(status==0){
  
  alert('User Already Exists! Login Now or try creating with different email id');

  document.getElementById('message').innerHTML=`<a href='/' class="text-white"> Login Now</a>`
  }
}   
   else
      alert('please fill complete form.') 
  
  }


function redirecttohome(){
 window.location.href='/';

}
