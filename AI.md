# mediCetamol `/ai/:questionId`

Machine-readable AI endpoint for PYQs.

## Rules

- Extremely lightweight.
- No navbar, app shell, buttons, icons, animation, or unnecessary UI.
- Contains the solving prompt + question + options.
- Does not expose the correct answer or explanation.
- Supports image-based questions.

## Image support

The question object may contain:

```ts
imageSrc?: string;
imageUrl?: string;
image?: string;
```

Priority is `imageSrc` → `imageUrl` → `image`.

When present, the endpoint emits:

```md
![Question image](IMAGE_URL)
```

No image URL is invented when the question record does not contain one.

## Architecture

- `/solve/:questionId` → human-facing mediCetamol page
- `/ai/:questionId` → minimal machine-readable AI content
