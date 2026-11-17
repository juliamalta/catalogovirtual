"use client";
import type { FormEvent, ReactNode } from "react";
export function ConfirmActionForm({action,children,message="Tem certeza de que deseja excluir este item?"}:{action:()=>Promise<void>;children:ReactNode;message?:string}){function confirm(event:FormEvent<HTMLFormElement>){if(!window.confirm(message))event.preventDefault()}return <form action={action} onSubmit={confirm} className="inline-form">{children}</form>}
