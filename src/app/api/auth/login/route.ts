import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    
    await dbConnect();

    const user = await User.findOne({ username, password }).lean() as any;

    if (user) {
      // Return the user data in the format the frontend expects (array)
      let userData = user.rawValues;
      if (!userData || userData.length === 0) {
        userData = [
          user.username, 
          user.password, 
          user.role, 
          user.phone, 
          user.name
        ];
      }
      
      // Force admin role for SCD008
      if (user.username === 'SCD008' || userData[0] === 'SCD008') {
        userData[2] = 'Admin';
      }
      
      return NextResponse.json({ success: true, user: userData });
    } else {
      return NextResponse.json({ success: false, message: "Invalid username or password" }, { status: 401 });
    }
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
