require("dotenv").config();
const { faker } = require("@faker-js/faker");
const { User } = require("./models");
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI);
const bcrypt = require("bcryptjs");
const getRandomUser = () => {
  return {
    firstName: faker.person.firstName(0),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    password: faker.internet.password(),
    bio: faker.person.bio(),
    profilePic: faker.image.avatar(),
  };
};
const populateData = async (data) => {
  for (const user of data) {
    const { firstName, lastName, email, password, bio, profilePic } = user;
    console.log(firstName, lastName, email, password, bio);
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: bcrypt.hashSync(password, 10),
      bio,
      profilePic,
    });
    await newUser.save();
  }
  console.log("done");
};

const users = faker.helpers.multiple(getRandomUser, { count: 3 });
populateData(users);
