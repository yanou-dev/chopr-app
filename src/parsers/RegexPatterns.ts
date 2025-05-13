interface RegexPatternMap {
  [key: string]: RegExp[];
}

const RegexPatterns: RegexPatternMap = {
  json: [
    /^\s*\{(?:"[^"]*"\s*:\s*(?:"[^"]*"|[^,{}]*|null|true|false|\[[^\]]*\]|\{[^{}]*\})|.*)*\}\s*$/i,
  ],
  log4j: [
    /^(?<date>\d{4}-\d{2}-\d{2})\s+(?<time>\d{1,2}:\d{2}:\d{2}(?:\.|,\d{1,3})?)\s+(?<level>INFO|DEBUG|WARN|ERROR|FATAL)\s+\[(?<class>.*?)\]\s+-\s+(?<message>.*)$/,
  ],
  logback: [
    /^(?<date>\d{4}-\d{2}-\d{2})\s+(?<time>\d{2}:\d{2}:\d{2}\.\d{3})\s+(?<level>[A-Z]+)\s+(?<logger>[\w\.]+(?:\.[\w\.]+)*)\s+-\s+(?<message>.*)$/,
    /^(?<timestamp>\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?)\s+(?<level>[A-Z]+)\s+(?<logger>[\w\.\d]+(?:\.[\w\.\d]+)*)\s+-\s+(?<message>.*)$/,
  ],
  nodejs: [
    /^(?<datetime>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z)\s+(?<level>info|debug|warn|error):(?<message>.*)/i,

    /^(?:\[(?<time>\d{2}:\d{2}:\d{2})\])?\s*(?:(?<level>LOG|INFO|WARN|DEBUG|ERROR)[: ])(?!(?<nonclass>[A-Za-z]+\.[A-Za-z]+\.))(?<message>.*)$/i,
    /^(?<time>\d{2}:\d{2}:\d{2})\s+(?:(?<level>log|info|warn|error|debug):|<(?<tag>.*)>)\s+(?<message>.*)$/i,
  ],
  logrus: [
    /^(?:time="(?<time>[^"]*)"\s+)?level=(?<level>info|debug|warn|error|fatal)\s+(?:msg="(?<message>[^"]*)"|(?<fields>\w+=[^ ]*)+)/i,

    /^\s*\{(?:"time":(?<time>"[^"]*").|"level":(?<level>"info"|"debug"|"warn"|"error"|"fatal").+)+\}\s*$/i,
  ],
  python: [
    /^(?<date>\d{4}-\d{2}-\d{2})\s+(?<time>\d{2}:\d{2}:\d{2},\d{3})\s+(?<level>INFO|DEBUG|WARNING|ERROR|CRITICAL)\s+(?:\[(?<module>[^\]]*)\])?\s+(?<message>.*)$/,

    /^(?<level>INFO|DEBUG|WARNING|ERROR|CRITICAL):(?<module>[^:]*):(?<message>.*)$/,
  ],
  nginx: [
    /^(?<ip>(?:\d{1,3}\.){3}\d{1,3})\s+-\s+(?<user>-|\w+)\s+\[(?<datetime>\d{2}\/[A-Za-z]{3}\/\d{4}:\d{2}:\d{2}:\d{2}\s+[\+-]\d{4})\]\s+"(?<method>GET|POST|PUT|DELETE|HEAD|OPTIONS|CONNECT|TRACE|PATCH)\s+(?<path>.*?)"\s+(?<status>\d{3})\s+(?<bytes>\d+)\s+"(?<referer>[^"]*)"\s+"(?<useragent>[^"]*)"(?:\s+"(?<extra>[^"]*)")?$/,

    /^(?<date>\d{4}\/\d{2}\/\d{2})\s+(?<time>\d{2}:\d{2}:\d{2})\s+\[(?<level>\w+)\]\s+(?<pid>\d+)(?:#(?<tid>\d+))?:\s+\*(?<connection>\d+)\s+(?<message>.*)$/,
  ],
  iis: [
    /^(?<date>\d{4}-\d{2}-\d{2})\s+(?<time>\d{2}:\d{2}:\d{2})\s+(?<ip>(?:\d{1,3}\.){3}\d{1,3})\s+(?<method>GET|POST|PUT|DELETE|HEAD|OPTIONS|CONNECT|TRACE|PATCH)\s+(?<path>.*)$/,

    /^(?<ip>(?:\d{1,3}\.){3}\d{1,3}), (?<user>-|\w+), (?<date>\d{4}-\d{2}-\d{2}), (?<time>\d{2}:\d{2}:\d{2}), (?<details>.*)$/,
  ],
  syslog: [
    /^(?:<(?<priority>\d{1,3})>)?(?:(?<timestamp>[A-Za-z]{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}|\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:[+-]\d{2}:\d{2}|Z)?))\s+(?<host>\S+)\s+(?<app>\S+)(?:\[(?<pid>\d+)\])?:(?<message>.*)$/,

    /^(?:<(?<priority>\d{1,3})>)(?<version>\d)\s+(?<timestamp>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:[+-]\d{2}:\d{2}|Z)?)\s+(?<hostname>[\w.-]+)\s+(?<app>[\w.-]+)\s+(?<procid>-|\d+)\s+(?<msgid>-|[\w\d]+)(?:\s*\[(?<structured_data>.*?)\])?(?<message>.*)$/,

    /^(?<date>\d{4}-\d{2}-\d{2})\s+(?<time>\d{2}:\d{2}:\d{2}\.\d{6}[+-]\d{4})\s+(?<host>\S+)\s+(?<process>[^\[]+)\[(?<pid>\d+)\]:\s+(?:\((?<component>[^)]+)\)\s+)?(?:\[(?<identifier>[^\]]+)\]\s+)?(?:\[(?<tag>[^\]]+)\]\s+)?(?<message>.*)$/,
  ],
  elasticsearch: [
    /^\[(?<timestamp>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2},\d{3})\]\[(?<level>INFO|DEBUG|WARN|ERROR|FATAL)\s*\]\[(?<component>.*?)\]\s+\[(?<node>.*?)\](?:\s+\[(?<index>.*?)\])?\s+(?<message>.*)$/,
  ],
  aws_cloudwatch: [
    /^(?<timestamp>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z)\s+(?<requestid>[0-9a-f-]+)\s+(?<level>INFO|DEBUG|WARN|ERROR|FATAL)\s+(?<message>.*)$/,

    /^(?<timestamp>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z)\s+(?<content>.*)\[(?<level>INFO|DEBUG|WARN|ERROR|FATAL)\](?<message>.*)$/,
  ],
  kubernetes: [
    /^(?<timestamp>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})?)\s+(?<level>INFO|DEBUG|WARN|ERROR|FATAL)\s+(?<message>.*)$/,

    /^(?<level>[A-Z])\s+(?<timestamp>\d{4} \d{2}:\d{2}:\d{2}(?:\.\d{1,6})?\s+\d+)\s+(?<component>[^ ]*):(?<filename>[^ ]*)(?:\s+\[(?<thread>.*?)\])?\s+(?<message>.*)$/,

    /^(?<level>[EFIWDV])(?<timestamp>\d{4} \d{2}:\d{2}:\d{2}(?:\.\d{1,9})?\s+\d+)\s+(?<source>[^ ]+\.[^ ]+:[^ ]+)\s+(?<message>.*)$/,
  ],
  rails: [
    /^(?<level_short>I|F|W|D|E), \[(?<timestamp>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{1,6}) #(?<pid>\d+)\]\s+(?<level>INFO|FATAL|WARN|DEBUG|ERROR) -- (?<context>:.*?)(?<message>.*)$/,

    /^(?:\[(?<context>.*?)\] )?(?<action>Processing|Parameters|Rendering|Rendered|Completed)\s+(?<details>.*)$/,
  ],
  tomcat: [
    /^(?<date>\d{2}-[A-Za-z]{3}-\d{4})\s+(?<time>\d{2}:\d{2}:\d{2}(?:\.\d{3})?)\s+(?<level>INFO|DEBUG|WARN|ERROR|FATAL|SEVERE)\s+\[(?<thread>.*?)\]\s+(?:\((?<source>.*?)\)\s+)?(?<message>.*)$/,
  ],
  clf: [
    /^(?<host>[^ ]+) (?<identity>[^ ]+) (?<user>[^ ]+) \[(?<time>[^\]]+)\] "(?<request>[^"]+)" (?<status>[0-9]{3}) (?<size>[0-9]+|-)$/,
  ],
};

export default RegexPatterns;
