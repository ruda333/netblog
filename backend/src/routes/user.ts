import { Hono } from "hono"
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { decode, sign, verify } from 'hono/jwt'
import {signupInput, signinInput} from "@hrudayvv/common";

export const userRouter = new Hono<{
    Bindings:{
        DATABASE_URL: string;
        JWT_SECRET: string;
    }
}
>();

userRouter.post('/signup', async (c) => {
    const body = await c.req.json(); 
    // sanitize
    // zod-> input validation
    // {
    //    "email": string,
    //     password: string
    //     name: optional string
    //  }
    const {success} = signupInput.safeParse(body);
    if (!success){
      c.status(411);
      return c.json({
        message: "Inputs are not correct friend"
      })
    }
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())
  
    try{
      // if duplicate user signup
      const user = await prisma.user.create({
        data:{
          username: body.username,
          password: body.password,
          name: body.name
        }
      })
      const jwt = await sign({
        id: user.id
      }, c.env.JWT_SECRET
    );
  
    return c.text(jwt);
    } catch(e) {
      console.log(e)
      c.status(411);
      return c.text('Inputs not correct')
    }
  });
  
  userRouter.post('/api/v1/user/signin', async (c) => {
    const body = await c.req.json();
    const {success} = signinInput.safeParse(body); 
    if (!success){
      c.status(411);
      return c.json({
        message: "Inputs are not correct friend"
      })
    }
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())
  
    try{
      // if duplicate user signup
      const user = await prisma.user.findFirst({
        where:{
          username: body.username,
          password: body.password
        }
      })
      if (!user){
        c.status(403); // unauthorized
        return c.json({
          message: "Incorrect credentials"
        })
      }
      const jwt = await sign({
        id: user.id
      }, c.env.JWT_SECRET
    );
  
    return c.text(jwt);
    } catch(e) {
      console.log(e)
      c.status(411);
      return c.text('Invalid')
    }
  });
  