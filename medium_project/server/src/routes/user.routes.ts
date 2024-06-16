import { Hono } from "hono";
import { verify, sign, decode } from 'hono/jwt'
import { withAccelerate } from '@prisma/extension-accelerate'
import { PrismaClient } from '@prisma/client/edge'


export const userRoutes = new Hono<{
    Bindings :{
        DATABASE_URL : string
        JWT_SECRET : string
    }
}>()

userRoutes.post('/signup', async (c) => {
    const prisma = new PrismaClient({
      datasourceUrl : c.env.DATABASE_URL,
    }).$extends(withAccelerate())
    
    const body = await c.req.json() 
    //@ts-ignore
    //zod, we didn't hashed password
    
    let user;
    try {
      //@ts-ignore
      user = await prisma.User.create({
        data:{
          //@ts-ignore
          email : body.email,
          //@ts-ignore
          password : body.password
        }
      })
      const token = await sign({id : user.id} , c.env.JWT_SECRET)
  
      if(!token){
        return c.json({
          msg : "TOken not created"
        })
      }
      return c.json({
        token
      })
    } catch (error) {
      return c.json({
        status : 411,
        msg : "Email already exists"
      })    
    }
})
  
userRoutes.post('/signin', async (c) => {
    const prisma = new PrismaClient({
      datasourceUrl : c.env.DATABASE_URL
    }).$extends(withAccelerate())
  
    const body = await c.req.json()
  
    const user = await prisma.user.findFirst({
      //@ts-ignore
        where :{
          email : body.email,
          password : body.password
        }
    })
  
    if(!user){
      return c.json({
        status : 413, // unauthorized
        msg : "User not found"
      })
    }
  
    const token = await sign({id : user.id}, c.env.JWT_SECRET)
  
    return c.json({
      msg :" Sigin successfull",
      token
    })
  
})