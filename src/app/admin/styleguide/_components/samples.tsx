import { ArrowRightIcon, ArrowUpRightIcon } from "lucide-react";
import { BibCard } from "@/components/site/bib-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export function TypeSamples() {
  return (
    <div className="space-y-6">
      <p className="font-display-upper text-hero italic">Sayfyho</p>
      <p className="font-display-upper text-display-1">Display 1 · Propozice</p>
      <p className="font-display-upper text-display-2">
        Display 2 · Výsledky 2026
      </p>
      <p className="font-display-upper text-display-3">
        Display 3 · Fotogalerie
      </p>
      <p className="kicker">Aktuality</p>
      <p className="text-body max-w-prose">
        Příliš žluťoučký kůň úpěl ďábelské ódy. Trasa závodu bude jasně
        vyznačena po rozmanitém terénu v okolí Hrobu a jezera Barbora — jeden
        okruh je dlouhý cca 14 km.
      </p>
      <p className="font-mono text-2xl tabular-nums">35 : 04 : 12 : 09</p>
    </div>
  );
}

export function ControlSamples() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="signal" size="xl">
          Registrace <ArrowUpRightIcon data-icon="inline-end" />
        </Button>
        <Button size="xl">
          Propozice <ArrowRightIcon data-icon="inline-end" />
        </Button>
        <Button variant="outline" size="lg">
          Outline
        </Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Smazat</Button>
        <Button variant="link">Odkaz</Button>
        <Button disabled>Disabled</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="destructive">Chyba</Badge>
      </div>
      <div className="grid max-w-md gap-4">
        <Field>
          <FieldLabel htmlFor="sg-title">Název</FieldLabel>
          <Input id="sg-title" defaultValue="Propozice 2026" />
          <FieldDescription>Maximálně 150 znaků.</FieldDescription>
        </Field>
        <Field data-invalid>
          <FieldLabel htmlFor="sg-email">E-mail</FieldLabel>
          <Input id="sg-email" aria-invalid defaultValue="neplatny@" />
          <FieldError>Zadejte platný e-mail.</FieldError>
        </Field>
        <Field orientation="horizontal">
          <Switch id="sg-switch" defaultChecked />
          <FieldLabel htmlFor="sg-switch">Registrace otevřena</FieldLabel>
        </Field>
      </div>
    </div>
  );
}

export function MotifSamples() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4">
        <BibCard number="16" caption="2026" />
        <BibCard number="134" caption="Sayfy" />
      </div>
      <div className="checker-band max-w-md rounded-sm" />
      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle>Karta</CardTitle>
          <CardDescription>
            Ohraničení + tónovaný povrch, bez stínu.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm">Obsah karty.</CardContent>
      </Card>
    </div>
  );
}
