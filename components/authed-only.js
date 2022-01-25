import {useEffect, useState} from "react";
import { SignedIn, SignedOut, SignIn, useUser } from '@clerk/nextjs';
import SignoutLink from "./navs/signout-link";
import SigninForm from "./navs/signin-form";
import LogUser from "./log-user";

export default function AuthedOnly({children}) {
  return (
    <main>
      <SignedIn>
        <LogUser />
        {children}
        <p><SignoutLink /></p>
      </SignedIn>
      <SignedOut>
        <SigninForm />
        <p className="small" style={{"textAlign":"center"}}>Note: Login emails may not display properly in Outlook. Please open the email in your browser if you have any trouble seeing the login link.</p>
      </SignedOut>
    </main>
  );
}
