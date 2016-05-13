#!/bin/bash

siege -c 50 -r 10 -H 'Content-Type: application/json' 'http://localhost:8000/jobs POST < models/job.json'


















