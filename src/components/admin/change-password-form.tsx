"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  changePasswordAction,
  type ChangePasswordState,
} from "@/server/actions/account";

const INITIAL: ChangePasswordState = {
  status: "idle",
  message: "",
  fieldErrors: {},
};

const FIELDS = [
  {
    name: "current",
    label: "Současné heslo",
    autoComplete: "current-password",
    hint: undefined,
  },
  {
    name: "next",
    label: "Nové heslo",
    autoComplete: "new-password",
    hint: "Alespoň 12 znaků.",
  },
  {
    name: "confirm",
    label: "Nové heslo znovu",
    autoComplete: "new-password",
    hint: undefined,
  },
] as const;

export function ChangePasswordForm({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState(
    changePasswordAction,
    INITIAL,
  );

  return (
    <form action={formAction} className="max-w-md space-y-5" noValidate>
      {/* Lets password managers update the right account. */}
      <input
        type="text"
        name="username"
        autoComplete="username"
        value={email}
        readOnly
        hidden
      />
      {FIELDS.map(({ name, label, autoComplete, hint }) => {
        const error = state.fieldErrors[name]?.[0];
        return (
          <Field
            key={`${name}-${state.status}`}
            data-invalid={error ? true : undefined}
          >
            <FieldLabel htmlFor={name}>{label}</FieldLabel>
            <Input
              id={name}
              name={name}
              type="password"
              autoComplete={autoComplete}
              required
              aria-invalid={error ? true : undefined}
              aria-describedby={
                error ? `${name}-error` : hint ? `${name}-hint` : undefined
              }
            />
            {hint && !error && (
              <FieldDescription id={`${name}-hint`}>{hint}</FieldDescription>
            )}
            {error && <FieldError id={`${name}-error`}>{error}</FieldError>}
          </Field>
        );
      })}
      <p
        role="status"
        className={
          state.status === "error"
            ? "text-destructive text-sm"
            : "text-primary text-sm"
        }
      >
        {state.message}
      </p>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Ukládám…" : "Změnit heslo"}
      </Button>
    </form>
  );
}
