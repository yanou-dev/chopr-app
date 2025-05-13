interface LogFormat {
  value: string;
  label: string;
}

const LogFormats: LogFormat[] = [
  {
    value: "auto",
    label: "Auto-detect (recommended)",
  },
  {
    value: "json",
    label: "JSON",
  },
  {
    value: "log4j",
    label: "Java (Log4j)",
  },
  {
    value: "logback",
    label: "Java (Logback)",
  },
  {
    value: "nodejs",
    label: "Node.js Console",
  },
  {
    value: "logrus",
    label: "Go Logrus",
  },
  {
    value: "python",
    label: "Python logging",
  },
  {
    value: "nginx",
    label: "Nginx Access Log",
  },
  {
    value: "iis",
    label: "IIS",
  },
  {
    value: "syslog",
    label: "Syslog",
  },
  {
    value: "elasticsearch",
    label: "Elasticsearch",
  },
  {
    value: "aws_cloudwatch",
    label: "AWS CloudWatch",
  },
  {
    value: "kubernetes",
    label: "Kubernetes",
  },
  {
    value: "rails",
    label: "Ruby on Rails",
  },
  {
    value: "tomcat",
    label: "Tomcat",
  },
  {
    value: "clf",
    label: "Common Log Format",
  },
  {
    value: "generic",
    label: "Generic text logs",
  },
];

export default LogFormats;
