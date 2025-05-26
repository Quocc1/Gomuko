import { LucideIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface MenuCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  content: string;
  buttonText?: string;
  buttonOnClick?: () => void;
  gradientFrom: string;
  gradientTo: string;
  textColor: string;
  descriptionColor: string;
  contentColor: string;
  buttonColor?: string;
  buttonHoverColor?: string;
  additionalButtons?: {
    text: string;
    onClick: () => void;
  }[];
}

export function MenuCard({
  title,
  description,
  icon: Icon,
  content,
  buttonText,
  buttonOnClick,
  gradientFrom,
  gradientTo,
  textColor,
  descriptionColor,
  contentColor,
  buttonColor,
  buttonHoverColor,
  additionalButtons,
}: MenuCardProps) {
  return (
    <Card className={`hover:scale-105 transition-all bg-gradient-to-br from-${gradientFrom} to-${gradientTo}`}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${textColor}`}>
          <Icon className="h-6 w-6 animate-pulse" />
          {title}
        </CardTitle>
        <CardDescription className={descriptionColor}>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {additionalButtons ? (
          <div className="flex flex-col gap-3">
            {additionalButtons.map((button, index) => (
              <Button
                key={index}
                className={`${buttonColor} ${buttonHoverColor}`}
                onClick={button.onClick}
              >
                {button.text}
              </Button>
            ))}
          </div>
        ) : (
          <p className={`text-sm ${contentColor}`}>{content}</p>
        )}
      </CardContent>
      {buttonText && buttonOnClick && (
        <CardFooter>
          <Button
            className={`w-full ${buttonColor} ${buttonHoverColor}`}
            onClick={buttonOnClick}
          >
            {buttonText}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
} 