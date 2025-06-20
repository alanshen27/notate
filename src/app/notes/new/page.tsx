"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function NewNotePage() {
    const router = useRouter();
    const { data: session } = useSession();

    useEffect(() => {
        createNewNote();
    }, []);

    if (!session) {
        return <div>Unauthenticated</div>;
    }

    const createNewNote = async () => {
        fetch("/api/notes", {
            method: "POST",
            body: JSON.stringify({
                title: "New Note",
            }),
        })
        .then(res => res.json())
        .then(data => {
            router.push(`/notes/${data.id}`);
        });
    }

  return <div>New Note</div>;
}