import React, { useState, useEffect} from 'react';
import "rbx/index.css";
import {Button,Container,Message, Title } from "rbx";
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
import CourseList from './components/CourseList'; 

const meetsPat = /^ *((?:M|Tu|W|Th|F)+) +(\d\d?):(\d\d) *[ -] *(\d\d?):(\d\d) *$/;

// FIREBASE

const firebaseConfig = {
  apiKey: "AIzaSyBImqaPL2W4gGHerdqVEDqU5dK2r2mnf7Q",
  authDomain: "scheduler-be292.firebaseapp.com",
  databaseURL: "https://scheduler-be292.firebaseio.com",
  projectId: "scheduler-be292",
  storageBucket: "",
  messagingSenderId: "802805933219",
  appId: "1:802805933219:web:bc695e96e0f86e595a4b16",
  measurementId: "G-QEDBWLPP22"
};


const db = firebase.database().ref();

// AUTH UI
const uiConfig = {
  signInFlow: 'popup',
  signInOptions: [
    firebase.auth.GoogleAuthProvider.PROVIDER_ID
  ],
  callbacks: {
    signInSuccessWithAuthResult: () => false
  }
};

const Welcome = ({ user }) => (
  <Message color="info">
    <Message.Header>
      Welcome, {user.displayName}
      <Button primary onClick={() => firebase.auth().signOut()}>
        Log out
      </Button>
    </Message.Header>
  </Message>
);

const SignIn = () => (
  <StyledFirebaseAuth
    uiConfig={uiConfig}
    firebaseAuth={firebase.auth()}
  />
);

const Banner = ({ user, title }) => (
  <React.Fragment>
    { user ? <Welcome user={ user } /> : <SignIn /> }
    <Title>{ title || '[loading...]' }</Title>
  </React.Fragment>
);



const timeParts = meets => {
  const [match, days, hh1, mm1, hh2, mm2] = meetsPat.exec(meets) || [];
  return !match ? {} : {
    days,
    hours: {
      start: hh1 * 60 + mm1 * 1,
      end: hh2 * 60 + mm2 * 1
    }
  };
};

const saveCourse = (course, meets) => {
  db.child('courses').child(course.id).update({meets})
    .catch(error => alert(error));
};

const moveCourse = course => {
  const meets = prompt('Enter new meeting data, in this format:', course.meets);
  if (!meets) return;
  const {days} = timeParts(meets);
  if (days) saveCourse(course, meets); 
  else moveCourse(course);
};
  




const addCourseTimes = course => ({
  ...course,
  ...timeParts(course.meets)
});

const addScheduleTimes = schedule => ({
  title: schedule.title,
  courses: Object.values(schedule.courses).map(addCourseTimes)
});

const App = () => {
  const [schedule, setSchedule] = useState({ title: '', courses: [] });
  const [user, setUser] = useState(null);

  useEffect(() => {
    const handleData = snap => {
      if (snap.val()) setSchedule(addScheduleTimes(snap.val()));
    };
    db.on('value', handleData, error => alert(error));
    return () => { db.off('value', handleData); };
  }, []);

  useEffect(() => {
    firebase.auth().onAuthStateChanged(setUser);
  }, []);

return (
    <Container>
      <Banner title={ schedule.title } user={ user } />
      <CourseList courses={ schedule.courses } user={ user } />
    </Container>
  );
};

export default App;
