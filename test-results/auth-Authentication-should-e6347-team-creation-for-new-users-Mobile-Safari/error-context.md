# Page snapshot

```yaml
- alert
- button "Open Next.js Dev Tools":
  - img
- banner:
  - link "Stack Template":
    - /url: /
  - button:
    - img
- heading "Sign in to your account" [level=2]
- paragraph:
  - text: Don't have an account?
  - link "Sign up":
    - /url: /handler/sign-up
- button "Sign in with Passkey":
  - img
  - text: Sign in with Passkey
- text: Or continue with Email
- textbox "Email"
- text: Password
- textbox "Password"
- button "Show password"
- link "Forgot password?":
  - /url: /handler/forgot-password
- button "Sign In"
```