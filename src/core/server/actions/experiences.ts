"use server"

import { redirect } from "next/navigation";
import { connectDB } from "../lib/db";
import { validateUserByToken } from "../middlewares/validateUserByToken";
import { ExperienceModel, IExperience, IExperienceDocument } from "../models/experiences";
import { createExperienceSchema } from "../schemas";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const LIMIT = 5

export async function getExperiencesPagesAction() {
  await connectDB();
  const totalCount = await ExperienceModel.countDocuments();

  return Math.ceil(totalCount / LIMIT)
}


export async function getExperiencesAction(page: number) {
  await connectDB();
  
  const experiences = await ExperienceModel.find() 
    .select("-_id")
    .sort({ listing_priority: -1 }) 
    .skip((page - 1) * LIMIT)
    .limit(LIMIT)
    .lean<IExperience[]>(); 
    
  return experiences
}


export async function createProjectAction({ token, payload }:{
  token: string,
  payload: z.infer<typeof createExperienceSchema>
}) {
  await connectDB();

  const isValid = validateUserByToken(token)
  if (!isValid) return redirect("/") 

  const { error } = createExperienceSchema.safeParse(payload)

  if (error) 
  return {
    data: null,
    success: false,
    message: error.message
  }

  const experience: IExperienceDocument = await ExperienceModel.create(payload)
  await experience.save()

  revalidatePath("/","page")
  
  return {
    data: null,
    success: true,
    message: "experience created successfully"
  }
}